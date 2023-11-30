// Julia Caro
// April 28, 2023

// Create needed constants
// Creating a variable that holds a reference to the list ul element
const list = document.querySelector('ul');
// Creating a variable that holds a reference to the input element
const input = document.querySelector('input');
// Creating a variable that holds a reference to the button element
const button = document.querySelector('button');
// Creating a variable that holds a reference to the body element
const bodyInput = document.querySelector('#body');
// Creating a variable that holds a reference to the form element
const form = document.querySelector('form');
// Creating a variable that holds a reference to the form button element
const submitBtn = document.querySelector('form button');

// Create an instance of a db object for us to store the open database in
let db;

// Open our database; it is created if it doesn't already exist (see the upgradeneeded handler below)
const openRequest = window.indexedDB.open('items_db', 1);

// Error handler signifies that the database didn't open successfully
openRequest.addEventListener('error', () =>
  console.error('Database failed to open')
);

// Success handler signifies that the database opened successfully
openRequest.addEventListener('success', () => {
  console.log('Database opened successfully');
  // Store the opened database object in the db variable. This is used a lot below
  db = openRequest.result;
  // Run the displayData() function to display the items already in the IDB
  displayData();
});

// Set up the database tables if this has not already been done
openRequest.addEventListener('upgradeneeded', (e) => {
  // Grab a reference to the opened database
  db = e.target.result;
  // Create an objectStore in our database to store items and an auto-incrementing key (an objectStore is similar to a 'table' in a relational database)
  const objectStore = db.createObjectStore('items_os', {
    keyPath: 'id',
    autoIncrement: true,
  });
  // Define what data items the objectStore will contain
  objectStore.createIndex("body", "body", { unique: false });
  console.log('Database setup complete');
});

// Create a submit event handler so that when the form is submitted the addData() function is run
form.addEventListener('submit', addData);

// Define the addData() function
function addData(e) {
  // Prevent default - we don't want the input box to submit in the conventional way
  e.preventDefault();
	// Grab the values entered into the form fields and store them in an object ready for being inserted into the DB
  const newItem = { body: bodyInput.value };
	// Open a read/write db transaction, ready for adding the data
	const transaction = db.transaction(['items_os'], 'readwrite');	
	// Call an object store that's already been added to the database
	const objectStore = transaction.objectStore('items_os');
	// Make a request to add our newItem object to the object store
	const addRequest = objectStore.add(newItem);
	// Upon successful adding of the request to the object store, the bodyInput's value is set to empty.
	addRequest.addEventListener('success', () => {
		// Clear the input box, ready for adding the next entry
    bodyInput.value = "";
	});
	
	// Report on the success of the transaction completing, when everything is done
	transaction.addEventListener('complete', () => {
	console.log('Transaction completed: database modification finished.');
	// Update the display of data to show the newly added item, by running displayData() again.
	displayData();
	});
	// If the transaction failed, console.log 'Transaction not opened due to error'
	transaction.addEventListener('error', () =>
	console.log('Transaction not opened due to error')
	);
}

// Define the displayData() function
function displayData() {
	// Here we empty the contents of the list element each time the display is updated (if you didn't do this, you'd get duplicates listed each time a new item is added)
	while (list.firstChild) {
	  list.removeChild(list.firstChild);
	}
	
	// Open our object store and then get a cursor - which iterates through all the different data items in the store
	const objectStore = db.transaction('items_os').objectStore('items_os');
	objectStore.openCursor().addEventListener('success', (e) => {
	  // Get a reference to the cursor
	  const cursor = e.target.result;
	
	  // If there is still another data item to iterate through, keep running this code
	  if (cursor) {
	    // Structure the HTML fragment, and append it inside the list
			// Storing a new list item in a variable
			const listItem = document.createElement('li');
			// Storing a new span in a variable
      const span = document.createElement('span');
			// Appending the span as a child of the list item
      listItem.appendChild(span);
			// Appending the list item as a child of the list
			list.appendChild(listItem);
	    // Put the data from the cursor inside the span
      span.textContent = cursor.value.body;
			// Store the ID of the data item inside an attribute on the listItem, so we know which item it corresponds to. This will be useful later when we want to delete items
	    listItem.setAttribute('data-item-id', cursor.value.id);
	    // Create a button and place it inside each listItem
			// Storing a new button in a variable
			const listButton = document.createElement('button');
			// Appending the button as a child of the list item
			listItem.appendChild(listButton);
			// Setting the text content of the button to 'Delete'
			listButton.textContent = 'Delete';
			// Removing the text content of the delete button
			listButton.textContent = '';
	
	    // Set an event handler so that when the button is clicked, the deleteItem() function is run
			listButton.addEventListener('click', deleteItem);
	
	    // Iterate to the next item in the cursor
	    cursor.continue();
	  } else {
	    	// Again, if list item is empty, display a 'No items stored' message
	      if (!list.firstChild) {
	        const listItem = document.createElement('li');
	        listItem.textContent = 'No items stored.';
	        list.appendChild(listItem);
	      }
	      // If there are no more cursor items to iterate through, say so
	      console.log('All items displayed');
	    }
	});
}

// Define the deleteItem() function
function deleteItem(e) {
  // Retrieve the name of the task we want to delete. We need to convert it to a number before trying to use it with IDB; IDB key values are type-sensitive.
  const itemId = Number(e.target.parentNode.getAttribute('data-item-id'));
  // Open a database transaction and delete the task, finding it using the id we retrieved above
  const transaction = db.transaction(['items_os'], 'readwrite');
  const objectStore = transaction.objectStore('items_os');
  const deleteRequest = objectStore.delete(itemId);
  // Report that the data item has been deleted
  transaction.addEventListener('complete', () => {
    // Delete the parent of the button which is the list item, so that it is no longer displayed
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
    console.log(`Item ${itemId} deleted.`);
    // Again, if list item is empty, display a 'No items stored' message
    if (!list.firstChild) {
      const listItem = document.createElement('li');
      listItem.textContent = 'No items stored.';
      list.appendChild(listItem);
    }
  });
}