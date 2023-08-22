const mainCategoryElement = document.getElementById('mainCategory') as HTMLSelectElement;
const subCategoryElement = document.getElementById('subCategory') as HTMLSelectElement;
const itemElement = document.getElementById('item') as HTMLSelectElement;
const countListElement = document.getElementById('countList') as HTMLTableElement;
const countInput = document.getElementById('countInput') as HTMLInputElement;
const messageElement = document.getElementById('statusMessage') as HTMLParagraphElement;
const renameListButton = document.getElementById('renameList') as HTMLButtonElement;

let selectedMainCategory: string | null = null;
let selectedSubCategory: string | null = null;
let selectedItem: string | null = null;

const listNameElement = document.getElementById('listName') as HTMLElement;
const listNameInput = document.getElementById('listNameInput') as HTMLInputElement; // Changed the ID

const importInventoryButton = document.getElementById('importInventory') as HTMLInputElement;
importInventoryButton.addEventListener('change', handleInventoryFileInputChange);

const clearBrowserDataButton = document.getElementById('clearBrowserDataButton') as HTMLButtonElement; // Added type
clearBrowserDataButton.addEventListener('click', clearAllBrowserData);

const incrementButton = document.getElementById('increment') as HTMLButtonElement;
incrementButton.addEventListener('click', () => {
  changeCount(1);
});
const decrementButton = document.getElementById('decrement') as HTMLButtonElement;
decrementButton.addEventListener('click', () => {
  changeCount(-1);
});

const clearListButton = document.getElementById('clearList') as HTMLButtonElement;
clearListButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the list?')) {
    localStorage.removeItem('countData');
    countListElement.innerHTML = '';
    clearImportedFileHashes(); // Add this line to clear imported file hashes except the source hash
  }
});

const exportCsvButton = document.getElementById('exportCsv') as HTMLButtonElement;
exportCsvButton.addEventListener('click', () => {
  exportListAsCSV();
});

const exportListButton = document.getElementById('exportList') as HTMLButtonElement;
exportListButton.addEventListener('click', () => {
  exportListAsJSON();
});

const importListButton = document.getElementById('importList') as HTMLInputElement;
importListButton.addEventListener('change', handleFileInputChange);

const savedListName = localStorage.getItem('listName');
if (savedListName) {
  listNameElement.textContent = savedListName;
}

type SubCategoryData = {
  [item: string]: ItemData;
};

type MainCategoryData = {
  [subCategory: string]: SubCategoryData;
};

type CountData = {
  [mainCategory: string]: MainCategoryData;
};

interface ItemData {
  count: number;
  addedBy: string;
  notes: Array<[string, number]>; // Array of tuples with string and number
}

const visitorId = getVisitorId();
generateQRCode(window.location.href);
displayCountList(getCountData());


async function handleInventoryFileInputChange(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.item(0);

  if (file && file.type === "application/json") {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const inventoryData = JSON.parse(e.target?.result as string);
        populateMainCategories(inventoryData);
      } catch (error) {
        showErrorOverlay();
        messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
        setTimeout(() => {
          messageElement.textContent = '';
        }, 3000);
      }
    };
    reader.readAsText(file);
  } else {
    messageElement.textContent = 'Please select a JSON file.';
    setTimeout(() => {
      messageElement.textContent = '';
    }, 5500);
  }
}

function annotateItem(mainCategory: string, subCategory: string, item: string): void {
  const currentData = getCountData();
  const itemData = currentData[mainCategory][subCategory][item];

  // Prompt the user to enter an note
  const note = prompt('Enter your note for this item:');
  if (note) {
    itemData.notes.push([visitorId, parseInt(note)]); // Add the visitorId and the parsed integer note
    setCountData(currentData);
  }
}


function showErrorOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'errorOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';

  const gifContainer = document.createElement('div');
  gifContainer.style.width = '400px';
  gifContainer.style.height = '400px';
  gifContainer.style.backgroundImage = 'url("https://media.tenor.com/1SastyjoZWoAAAAj/dennis-nedry.gif")';
  gifContainer.style.backgroundSize = 'contain';
  gifContainer.style.backgroundRepeat = 'no-repeat';
  gifContainer.style.backgroundPosition = 'center center';

  overlay.appendChild(gifContainer);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 2000);
}

fetch('/scrapedData/activePlayers_2023_08_20_09_36.json')
  .then(async response => {
    const buffer = await response.arrayBuffer();
    const hash = await digestMessage(buffer);
    const jsonData = new TextDecoder().decode(buffer);
    return { menuData: JSON.parse(jsonData), hash };
  })
  .then(({ menuData, hash }) => {
    populateMainCategories(menuData);
    localStorage.setItem('sourceHash', hash);
  })
  .catch(error => {
    console.error('Error fetching menu data:', error);
    showErrorOverlay();
  });

  async function loadInventory(): Promise<CountData> {
    const response = await fetch('inventory.json');
    const jsonData = await response.json();
    const countData: CountData = {};
  
    for (const mainCategory in jsonData) {
      for (const subCategory in jsonData[mainCategory]) {
        for (const item of Object.keys(jsonData[mainCategory][subCategory])) {
          if (!countData[mainCategory]) countData[mainCategory] = {};
          if (!countData[mainCategory][subCategory]) countData[mainCategory][subCategory] = {};
          if (!countData[mainCategory][subCategory][item]) {
            countData[mainCategory][subCategory][item] = {
              count: 0,
              addedBy: visitorId, // <-- Make sure visitorId is defined somewhere in your code
              notes: [],
            };
          }
        }
      }
    }
    return countData;
  }

function populateMainCategories(menuData: CountData): void {
  mainCategoryElement.innerHTML = '';
  Object.keys(menuData).forEach(key => {
    const optionItem = document.createElement('option');
    optionItem.textContent = key;
    mainCategoryElement.appendChild(optionItem);
  });

  mainCategoryElement.style.display = 'inline';
  mainCategoryElement.addEventListener('change', () => {
    populateSubCategories(menuData[mainCategoryElement.value]);
  });

  populateSubCategories(menuData[mainCategoryElement.value]);
}

function populateSubCategories(subCategories: any) {
  subCategoryElement.innerHTML = '';
  Object.keys(subCategories).forEach(key => {
    const optionItem = document.createElement('option');
    optionItem.textContent = key;
    subCategoryElement.appendChild(optionItem);
  });

  subCategoryElement.style.display = 'inline';
  subCategoryElement.addEventListener('change', () => {
    populateItems(subCategories[subCategoryElement.value]);
  });

  populateItems(subCategories[subCategoryElement.value]);
}

function addItem(mainCategory: string, subCategory: string, item: string): void {
  const currentData = getCountData();
  if (!currentData[mainCategory]) {
    currentData[mainCategory] = {};
  }
  if (!currentData[mainCategory][subCategory]) {
    currentData[mainCategory][subCategory] = {};
  }
  if (!currentData[mainCategory][subCategory][item]) {
    currentData[mainCategory][subCategory][item] = {
      count: 1,
      addedBy: visitorId,
      notes: [[visitorId, 1]] // <-- Initialize the 'notes' property here with visitorId
    };
  } else {
    currentData[mainCategory][subCategory][item].count++;
    currentData[mainCategory][subCategory][item].notes.push([visitorId, 1]); // <-- Add 1 as a new note with visitorId
  }
  setCountData(currentData);
}

function handleRowClick(row, item, mainCategory, subCategory, count) {
  const newCount = prompt(`Enter the updated count for ${item} (${mainCategory} > ${subCategory}):`, count.toString());
  if (newCount !== null) {
    const difference = parseInt(newCount) - count;
    const differenceCell = row.cells[1]; // Assuming the difference cell is at index 1
    differenceCell.textContent = difference.toString();
    differenceCell.style.color = difference < 0 ? 'red' : 'green';

    // Update the count and notes in local storage
    const currentData = getCountData();
    currentData[mainCategory][subCategory][item].count = parseInt(newCount);
    currentData[mainCategory][subCategory][item].notes.push([visitorId, difference]); // Push the difference as a new note with visitorId
    setCountData(currentData); // Update the local storage with the new data
  }
}

function populateItems(items: string[]) {
  itemElement.innerHTML = '';
  items.forEach(itemName => {
    const optionItem = document.createElement('option');
    optionItem.textContent = itemName;
    itemElement.appendChild(optionItem);
  });

  itemElement.style.display = 'inline';
}

function changeCount(sign: number) {
  const count = parseInt(countInput.value, 10) * sign;
  const mainCategory = mainCategoryElement.value;
  const subCategory = subCategoryElement.value;
  const item = itemElement.value;

  const countData = getCountData();

  if (!countData[mainCategory]) countData[mainCategory] = {};
  if (!countData[mainCategory][subCategory]) countData[mainCategory][subCategory] = {};
  if (!countData[mainCategory][subCategory][item]) {
    countData[mainCategory][subCategory][item] = {
      count: 0,
      addedBy: visitorId,
      notes: [], // Add this line
    };
  }

  if (sign < 0 && countData[mainCategory][subCategory][item].count + count < 0) {
    showErrorOverlay();
    messageElement.textContent = `Cannot subtract ${Math.abs(count)} from ${item} as it doesn't have enough quantity!`;
    setTimeout(() => {
      messageElement.textContent = '';
    }, 5500);
    return;
  }

  countData[mainCategory][subCategory][item].count += count;

  setCountData(countData);

  console.log('Updated count:', countData);
  displayCountList(countData);

  countInput.value = '1';
  messageElement.textContent = `Recorded ${count >= 0 ? 'add' : 'subtract'} ${Math.abs(count)} of ${item}!`;
  setTimeout(() => {
    messageElement.textContent = '';
  }, 3000);
}

renameListButton.addEventListener('click', () => {
  const currentListName = listNameElement.textContent;
  const newListName = prompt('Enter the new name for the list:', currentListName);
  if (newListName !== null && newListName.trim() !== '') {
    listNameElement.textContent = newListName.trim();
    localStorage.setItem('listName', newListName.trim());
  }
});

async function digestMessage(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function updateListNameDisplay(listName: string) {
  listNameElement.textContent = listName;
  document.title = listName;
}

function displayCountList(data: CountData): void {
  const countListElement = document.getElementById('countList') as HTMLTableElement;
  countListElement.innerHTML = '';

  // Create colgroup with column widths
  const colgroup = document.createElement('colgroup');
  const col1 = document.createElement('col');
  col1.style.width = '10%';
  colgroup.appendChild(col1);

  const col2 = document.createElement('col');
  col2.style.width = '20%';
  colgroup.appendChild(col2);

  const col3 = document.createElement('col');
  col3.style.width = '35%';
  colgroup.appendChild(col3);

  const col4 = document.createElement('col');
  col4.style.width = '20%';
  colgroup.appendChild(col4);

  const col5 = document.createElement('col');
  col5.style.width = '15%';
  colgroup.appendChild(col5);

  countListElement.appendChild(colgroup);

  // Create table headers
  const header = countListElement.createTHead();
  const headerRow = header.insertRow(0);
  headerRow.insertCell(0).textContent = '#';
  headerRow.insertCell(1).textContent = '+/-';
  headerRow.insertCell(2).textContent = 'Item';
  headerRow.insertCell(3).textContent = 'Type';
  headerRow.insertCell(4).textContent = 'Category';

  // Insert table data
  for (const mainCategory in data) {
    for (const subCategory in data[mainCategory]) {
      for (const item in data[mainCategory][subCategory]) {
        const count = getCountData()[mainCategory]?.[subCategory]?.[item]?.count || 0;
        const notes = getCountData()[mainCategory]?.[subCategory]?.[item]?.notes || [];
        const row = countListElement.insertRow(-1);

        row.insertCell(0).textContent = count.toString();

        // Display the last note (ignoring visitorId)
        if (notes.length > 0) {
          const lastAnnotation = notes[notes.length - 1][1];
          const noteCell = row.insertCell(1);
          noteCell.textContent = lastAnnotation.toString();

          // Add a CSS class based on visitorId
          const lastAnnotationVisitorId = notes[notes.length - 1][0];
          if (lastAnnotationVisitorId === visitorId) {
            noteCell.classList.add('current-session');
          } else {
            noteCell.classList.add('imported-session');
          }

          // Set the color based on the value of the last note
          noteCell.style.color = lastAnnotation < 0 ? 'red' : 'green';
        } else {
          row.insertCell(1).textContent = '';
        }

        row.insertCell(2).textContent = item;
        row.insertCell(3).textContent = subCategory;
        row.insertCell(4).textContent = mainCategory;

        row.addEventListener('click', () => handleRowClick(row, item, mainCategory, subCategory, count));
      }
    }
  }
}


function getCountData(): CountData {
  const countDataString = localStorage.getItem('countData');
  if (countDataString) {
    return JSON.parse(countDataString);
  } else {
    return {};
  }
}

function setCountData(countData: any): void {
  const countDataString = JSON.stringify(countData);
  localStorage.setItem('countData', countDataString);
}

function exportListAsJSON(): void {
  const countData = getCountData();
  const sourceHash = localStorage.getItem('sourceHash');

  // Prepare the export data with notes
  const exportData: any = { sourceHash: sourceHash || '' };
  for (const mainCategory in countData) {
    if (!exportData[mainCategory]) {
      exportData[mainCategory] = {};
    }
    for (const subCategory in countData[mainCategory]) {
      if (!exportData[mainCategory][subCategory]) {
        exportData[mainCategory][subCategory] = {};
      }
      for (const item in countData[mainCategory][subCategory]) {
        exportData[mainCategory][subCategory][item] = {
          count: countData[mainCategory][subCategory][item].count,
          addedBy: countData[mainCategory][subCategory][item].addedBy,
          notes: countData[mainCategory][subCategory][item].notes,
        };
      }
    }
  }

  const dataString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Get the list name from the listNameElement and append visitor UUID
  const listName = listNameElement.textContent || 'Current_Count';
  const fileName = `${listName}_${visitorId}.json`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

function exportListAsCSV() {
  const countData = getCountData();
  const sourceHash = localStorage.getItem('sourceHash') || '';

  // Prepare the CSV headers
  const headers = ['Count', 'Diff', 'Item', 'Type', 'Category'];
  let csvContent = headers.join(',') + '\n';

  // Iterate through the countData object and create rows for the CSV
  for (const mainCategory in countData) {
    for (const subCategory in countData[mainCategory]) {
      for (const item in countData[mainCategory][subCategory]) {
        const count = countData[mainCategory][subCategory][item].count;
        const notes = countData[mainCategory][subCategory][item].notes;
        const diff = notes.length > 0 ? notes[0][1] : '';
        const row = [count, diff, item, subCategory, mainCategory];
        csvContent += row.join(',') + '\n';
      }
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Get the list name from the listNameElement and append visitor UUID
  const listName = listNameElement.textContent || 'Current_Count';
  const fileName = `${listName}_${visitorId}.csv`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = generateUniqueId();
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function handleFileInputChange(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.item(0);

  if (file && file.type === "application/json") {
    const buffer = await file.arrayBuffer();
    const fileHash = await digestMessage(buffer);
    const importedFileHashes = getImportedFileHashes();

    if (importedFileHashes.includes(fileHash)) {
      showErrorOverlay();
      messageElement.textContent = 'This file has already been imported.';
      setTimeout(() => {
        messageElement.textContent = '';
      }, 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (!validateImportedData(importedData)) {
          showErrorOverlay();
          messageElement.textContent = 'Error loading JSON file: Invalid data format.';
          setTimeout(() => {
            messageElement.textContent = '';
          }, 3000);
          return;
        }

        const storedSourceHash = localStorage.getItem('sourceHash');
        const importedSourceHash = importedData.sourceHash;

        if (storedSourceHash !== importedSourceHash) {
          showErrorOverlay();
          messageElement.textContent = 'Warning: The source of the imported file is not identical to the current source file which will cause issues in summing multiple counts.';
          setTimeout(() => {
            messageElement.textContent = '';
          }, 10000);
        }
        
        delete importedData.sourceHash; // Remove sourceHash from jsonData before merging with the current count

        const currentData = getCountData();

        // Merge the imported data with the current data
        const mergedData = mergeCountData(currentData, importedData);
        for (const mainCategory in mergedData) {
          for (const subCategory in mergedData[mainCategory]) {
            for (const item in mergedData[mainCategory][subCategory]) {
              if (!mergedData[mainCategory][subCategory][item].notes) {
                mergedData[mainCategory][subCategory][item].notes = [];
              }
            }
          }
        }

        setCountData(mergedData);
        displayCountList(mergedData);

        // Update the list of imported file hashes
        updateImportedFileHashes(fileHash);
      } catch (error) {
        showErrorOverlay();
        messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
        setTimeout(() => {
          messageElement.textContent = '';
        }, 3000);
      }
    };
    reader.readAsText(file);
  } else {
    messageElement.textContent = 'Please select a JSON file.';
    setTimeout(() => {
      messageElement.textContent = '';
    }, 5500);
  }
}

function getImportedFileHashes(): string[] {
  const importedFileHashesString = localStorage.getItem('importedFileHashes');
  if (importedFileHashesString) {
    return JSON.parse(importedFileHashesString);
  } else {
    return [];
  }
}

function updateImportedFileHashes(newHash: string): void {
  const importedFileHashes = getImportedFileHashes();
  importedFileHashes.push(newHash);
  localStorage.setItem('importedFileHashes', JSON.stringify(importedFileHashes));
}

function mergeCountData(currentData: CountData, importedData: CountData): CountData {
  const result: CountData = JSON.parse(JSON.stringify(currentData));

  for (const mainCategory in importedData) {
    if (!result[mainCategory]) {
      result[mainCategory] = importedData[mainCategory];
    } else {
      for (const subCategory in importedData[mainCategory]) {
        if (!result[mainCategory][subCategory]) {
          result[mainCategory][subCategory] = importedData[mainCategory][subCategory];
        } else {
          for (const item in importedData[mainCategory][subCategory]) {
            if (!result[mainCategory][subCategory][item]) {
              result[mainCategory][subCategory][item] = importedData[mainCategory][subCategory][item];
            } else {
              const currentCount = result[mainCategory][subCategory][item].count;
              const importedCount = importedData[mainCategory][subCategory][item].count;
              result[mainCategory][subCategory][item].count = currentCount + importedCount;

              // Merge notes array
              const currentNotes = result[mainCategory][subCategory][item].notes || [];
              const importedNotes = importedData[mainCategory][subCategory][item].notes || [];
              result[mainCategory][subCategory][item].notes = currentNotes.concat(importedNotes);
            }
          }
        }
      }
    }
  }

  return result;
}

function clearImportedFileHashes(): void {
  const sourceHash = localStorage.getItem('sourceHash');
  if (sourceHash) {
    localStorage.setItem('importedFileHashes', JSON.stringify([sourceHash]));
  } else {
    localStorage.removeItem('importedFileHashes');
  }
}

function clearAllBrowserData() {
  if (confirm('Are you sure you want to clear all browser data for this page?')) {
    // List all the keys you want to remove from the local storage
    const keysToRemove = [
      'countData',
      'listName',
      'sourceHash',
      'visitorId',
      'importedFileHashes',
    ];

    // Remove each key from the local storage
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Optionally, reload the page to reflect the changes
    window.location.reload();
  }
}

function validateImportedData(importedData: any): boolean {
  if (!importedData) {
    return false;
  }

  if (!importedData.hasOwnProperty('sourceHash') || typeof importedData.sourceHash !== 'string') {
    return false;
  }

  for (const mainCategory in importedData) {
    if (mainCategory === 'sourceHash') {
      continue; // Ignore the sourceHash property
    }
    if (typeof mainCategory !== 'string') {
      return false;
    }

    // ... rest of the code
  }

  return true;
}

function generateQRCode(url: string): void {
  const qrcodeElement = document.getElementById("qrcode");
  qrcodeElement.innerHTML = ""; // Clear any existing QR code
  new QRCode(qrcodeElement, {
    text: url,
    width: 90, // Set the desired width
    height: 90, // Set the desired height
  });
}