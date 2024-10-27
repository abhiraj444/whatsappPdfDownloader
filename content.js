// Create the button element for downloading the latest PDFs
const downloadLatestButton = document.createElement('button');
downloadLatestButton.textContent = 'Download Latest PDFs';
downloadLatestButton.style.position = 'fixed';
downloadLatestButton.style.top = '10px';
downloadLatestButton.style.right = '500px';
downloadLatestButton.style.zIndex = '1000';
downloadLatestButton.style.padding = '10px';
downloadLatestButton.style.backgroundColor = '#ff5722'; // Different color for differentiation
downloadLatestButton.style.color = 'white';
downloadLatestButton.style.border = 'none';
downloadLatestButton.style.borderRadius = '5px';
downloadLatestButton.style.cursor = 'pointer';
document.body.appendChild(downloadLatestButton);

let isScrolling = false;
let scrollInterval;
let clickedLinks = new Set();
let latestDatePosition = null;
let pdfClickCount = 0;  // Keep track of the number of PDF links clicked

// Download latest PDFs from the bottom of the chat
const downloadLatestPDFs = () => {
  clickedLinks = new Set(); // Reset clicked links set each time the button is pressed
  pdfClickCount = 0; // Reset the PDF click count

  const chatDiv = document.querySelector('.x1rife3k');
  if (!chatDiv) {
    console.error('Chat container not found');
    return;
  }

  // Extract chat name for folder naming - searching globally
  const chatNameElement = document.querySelector('div._amie');
  if (!chatNameElement) {
    console.error('Chat name element not found');
    return;
  }
  const chatName = chatNameElement.textContent.trim().replace(/[/\\?%*:|"<>]/g, ''); // Remove illegal characters for folder name

  isScrolling = true;
  scrollInterval = setInterval(() => {
    chatDiv.scrollBy(0, -100); // Scroll up by 100 pixels to reach the latest date
    const latestDateElement = findLatestDateElement(chatDiv);
    if (latestDateElement && isInViewport(latestDateElement)) {
      clearInterval(scrollInterval);
      isScrolling = false;
      latestDatePosition = latestDateElement.getBoundingClientRect().bottom;
      console.log('Reached the latest date:', latestDateElement.textContent.trim());
      // Start scrolling down to download PDFs
      scrollInterval = setInterval(() => {
        chatDiv.scrollBy(0, 20); // Scroll down by 20 pixels
        downloadVisiblePDFs(chatDiv);
        if (chatDiv.scrollHeight - chatDiv.scrollTop === chatDiv.clientHeight) {
          clearInterval(scrollInterval);
          isScrolling = false;
          console.log('Reached the end of the chat, no more PDFs to download');
          notifyServerToMovePDFs(chatName, pdfClickCount);  // Notify server to move PDFs after download is complete
        }
      }, 20);
    }
  }, 10); // Adjust interval for smoothness
};

// Define the function to download visible PDFs
const downloadVisiblePDFs = (chatDiv) => {
  const pdfLinks = chatDiv.querySelectorAllXPath("//div[@role='button' and contains(@title, 'Download') and contains(@title, '.pdf')]");
  pdfLinks.forEach((link) => {
    const linkPosition = link.getBoundingClientRect().top;
    if (linkPosition > latestDatePosition && isInViewport(link) && !clickedLinks.has(link)) {
      console.log('PDF link found in viewport:', link.title);
      link.click();
      clickedLinks.add(link);
      pdfClickCount++;  // Increment the count each time a PDF link is clicked
      console.log('Total PDFs clicked so far:', pdfClickCount);
    }
  });
};

// Function to notify the Python server to move the PDFs
const notifyServerToMovePDFs = (chatName, pdfClickCount) => {
  fetch('http://127.0.0.1:5000/move_pdfs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      download_folder: 'C:\\Users\\Administrator\\Downloads\\whatsapptestDocument',  // Adjust to your download folder
      target_folder: 'C:\\Users\\Administrator\\Desktop\\targetWhatsappDocument',
      chat_name: chatName,
      pdf_count: pdfClickCount  // Send the count of PDFs clicked
    }),
  })
  .then(response => response.text())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
};

// Find the latest date element in the chat
const findLatestDateElement = (chatDiv) => {
  const dateElements = chatDiv.querySelectorAll('div._amk4._amkb span._ao3e');
  return dateElements.length > 0 ? dateElements[dateElements.length - 1] : null;
};

// Helper function to run XPath query and return elements
Element.prototype.querySelectorAllXPath = function(xpath) {
  const nodesSnapshot = document.evaluate(xpath, this, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const result = [];
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    result.push(nodesSnapshot.snapshotItem(i));
  }
  return result;
};

// Helper function to check if an element is in the viewport
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Add the click event to the button
downloadLatestButton.addEventListener('click', () => {
  if (!isScrolling) {
    downloadLatestPDFs();
  } else {
    clearInterval(scrollInterval);
    isScrolling = false;
    console.log('Scrolling stopped');
  }
});
