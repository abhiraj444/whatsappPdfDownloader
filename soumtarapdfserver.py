from flask import Flask, request
from flask_cors import CORS
import os
import shutil
import time
import subprocess
import win32print

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Endpoint to move PDFs and print them
@app.route('/move_pdfs_and_print', methods=['POST'])
def move_pdfs_and_print():
    data = request.json
    download_folder = data.get('download_folder')
    target_base_folder = data.get('target_folder')
    chat_name = data.get('chat_name')
    expected_pdf_count = data.get('pdf_count')

    # Ensure all necessary data is provided
    if not download_folder or not target_base_folder or not chat_name or expected_pdf_count is None:
        return "Missing download folder, target folder, chat name, or PDF count", 400

    # Create the target folder if it does not exist
    target_folder = os.path.join(target_base_folder, chat_name)
    if not os.path.exists(target_folder):
        os.makedirs(target_folder)

    # Move the downloaded PDF files and count how many have been moved
    moved_files_count = 0
    while moved_files_count < expected_pdf_count:
        for file_name in os.listdir(download_folder):
            if file_name.endswith(".pdf"):
                source = os.path.join(download_folder, file_name)
                destination = os.path.join(target_folder, file_name)

                try:
                    shutil.move(source, destination)
                    moved_files_count += 1
                    print(f"Moved: {file_name} to {target_folder}")
                except Exception as e:
                    print(f"Error moving file {file_name}: {e}")

        # If the count does not match yet, wait before re-checking
        if moved_files_count < expected_pdf_count:
            print(f"Waiting for all downloads to complete... ({moved_files_count}/{expected_pdf_count})")
            time.sleep(2)

    # All files are moved, now trigger the print job
    print_all_pdfs_in_folder(target_folder)

    return f"PDFs moved and print job triggered successfully: {moved_files_count}/{expected_pdf_count}", 200

def print_pdf_with_sumatra(file_path, printer_name):
    try:
        sumatra_path = r"C:\Users\lenovo\AppData\Local\SumatraPDF"  # Adjust as needed
        subprocess.run([sumatra_path, "-print-to", printer_name, file_path], check=True)
        print(f"Sent to SumatraPDF for printing: {file_path}")
    except Exception as e:
        print(f"Error printing with SumatraPDF: {e}")

def print_all_pdfs_in_folder(folder_path):
    # Get the default printer name
    printer_name = win32print.GetDefaultPrinter()
    for file_name in os.listdir(folder_path):
        if file_name.endswith(".pdf"):
            file_path = os.path.join(folder_path, file_name)
            print_pdf_with_sumatra(file_path, printer_name)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
