const soundEditorReference = document.getElementById('sound-editor');
const soundListReference = document.getElementById('sound-list');

var isBeepBoxOpened = false;


// ****************************************************** //
// Storage
// ****************************************************** //
async function saveSong(name, song) {
	let songs = null;

	const storage = await browser.storage.local.get();
	songs = storage['songs'];

	if (songs == undefined) {
		songs = {};
	}

	songs[name] = song;
	browser.storage.local.set({'songs': songs});
}

async function getSongs() {
	let songs = [];

	try {
		const storage = await browser.storage.local.get();
		songs = storage['songs'];
	} catch (error) {}

	return songs;
}


// ****************************************************** //
// Modals
// ****************************************************** //
function createTabModal(id) {
	const modal = document.createElement('div');

	modal.id = id;
	modal.className = 'modal';

	modal.dataset.selectedTab = '';

	modal.innerHTML = `
	<div class='modal-box'>
		<button class='modal-close-button'>&times;</button>
		<div class='modal-inside'></div>
	</div>
	`;


	const closeButton = modal.getElementsByClassName('modal-close-button')[0];
	closeButton.onclick = () => {
		modal.style.display = 'none';
	};


	document.body.appendChild(modal);
}

function switchModalTab(modalId, tabLayer) {
	const modal = document.getElementById(modalId);
	const inside = modal.getElementsByClassName('modal-inside')[0];

	const layers = inside.querySelectorAll('.modal-layer');
	layers.forEach((layer) => {
		layer.style.display = 'none';
	});

	document.getElementById(`${modalId}/${tabLayer}`).style.display = 'block';
	modal.dataset.selectedTab = tabLayer;
}

function createModalLayer(html, modalId, layerId) {
	const modal = document.getElementById(modalId);
	const inside = modal.getElementsByClassName('modal-inside')[0];


	const newLayer = document.createElement('div');
	newLayer.id = `${modalId}/${layerId}`;
	newLayer.className = 'modal-layer';

	newLayer.innerHTML = html;


	inside.appendChild(newLayer);
}

// ****************************************************** //
// Editor
// ****************************************************** //
async function createSoundLayerFromURL(url, name) {
	const importInput = document.getElementById('sound-file-input');

	const soundBlob = await fetch(url).then(response => response.blob());
	const soundFile = new File([soundBlob], name + '.wav', {type: 'audio/wav'});
	const files = [soundFile];

	const importFiles = new DataTransfer();
	files.forEach(file => {
		importFiles.items.add(file);
	});

	importInput.files = importFiles.files;
	importInput.dispatchEvent(new Event('change', {bubbles: true}));

	alert('Song built!');
}

function createEditor(placement) {
	const beepBoxEditor = document.createElement('iframe');
	beepBoxEditor.id = 'beepBoxEditor';

	beepBoxEditor.src = browser.runtime.getURL('beepbox/app.html');
	beepBoxEditor.height = 600;

	beepBoxEditor.style.background = 'var(--editor-background)';
	beepBoxEditor.style.border = 'none';
	beepBoxEditor.style.borderRadius = '5px';

	beepBoxEditor.style.width = '100%';

	beepBoxEditor.hidden = true;

	placement.appendChild(beepBoxEditor);
}

function createControls(placement) {
	const controls = document.createElement('div');
	controls.id = 'beepBoxControls';

	controls.innerHTML = `
		<button class='controls-button' id='beepBoxSaveButton'>&#9873; Save</button>
		<button class='controls-button' id='beepBoxLoadButton'>&#10066; Load</button>
		<button class='controls-button' id='beepBoxBuildButton'>&#9874; Build</button>
		<button class='controls-button' id='beepBoxAboutButton'>&starf; About</button>
	`;

	controls.className = 'controls';
	controls.style.display = 'none';

	placement.appendChild(controls);

	document.getElementById('beepBoxSaveButton').addEventListener('click', onSaveButtonClicked);
	document.getElementById('beepBoxLoadButton').addEventListener('click', onLoadButtonClicked);
	document.getElementById('beepBoxBuildButton').addEventListener('click', onBuildButtonClicked);
	document.getElementById('beepBoxAboutButton').addEventListener('click', onAboutButtonClicked);
}

function createSwitchButton(placement) {
	const switchButton = document.createElement('button');
	switchButton.className = 'switch-button';
	switchButton.innerHTML = '&#9998; Switch Mode';

	switchButton.addEventListener('click', onSwitchButtonClicked);

	placement.appendChild(switchButton);
}

function createAllMusicUI() {
	if (soundEditorReference == undefined) {
		setTimeout(createAllMusicUI, 5);
		return;
	}

	createEditor(soundEditorReference);
	createControls(soundEditorReference);
	createSwitchButton(soundEditorReference);
}


// ****************************************************** //
// Events
// ****************************************************** //
async function onBuildButtonClicked() {
	const contentWindow = document.getElementById('beepBoxEditor').contentWindow;
	const soundURL = await contentWindow.eval('_exportToWav')();

	createSoundLayerFromURL(soundURL, 'New Song');
}


function onAboutButtonClicked() {
	switchModalTab('mainModal', 'about');
	document.getElementById('mainModal').style.display = 'flex';
}


function onSaveButtonClicked() {
	switchModalTab('mainModal', 'save');
	document.getElementById('mainModal').style.display = 'flex';
}

async function onLoadButtonClicked() {
	switchModalTab('mainModal', 'load');

	const loadOptions = document.getElementById('mainModal/load').getElementsByTagName('select')[0];
	const songs = await getSongs();

	loadOptions.innerHTML = ''; // Clear previous options

	Object.keys(songs).forEach(song => {
		songOption = document.createElement('option');
		songOption.innerText = song;
		songOption.value = songs[song];

		loadOptions.appendChild(songOption);
	});

	document.getElementById('mainModal').style.display = 'flex';
}


async function onModalSaveButtonClicked() {
	const modal = document.getElementById('mainModal');

	const contentWindowReference = document.getElementById('beepBoxEditor').contentWindow;
	const soundBase64 = await contentWindowReference.eval('getSongAsBase64')();

	const songNameInput = document.getElementById('mainModal/save').getElementsByTagName('input')[0];

	saveSong(songNameInput.value, soundBase64);
	modal.style.display = 'none';
}

async function onModalLoadButtonClicked() {
	const modal = document.getElementById('mainModal');

	const contentWindowReference = document.getElementById('beepBoxEditor').contentWindow;
	const loadOptions = document.getElementById('mainModal/load').getElementsByTagName('select')[0];

	await contentWindowReference.eval('loadSongFromBase64')(loadOptions.value);

	modal.style.display = 'none';
}


function onSwitchButtonClicked() {
	const beepBoxControls = document.getElementById('beepBoxControls');
	const beepBoxEditorReference = document.getElementById('beepBoxEditor');

	if (isBeepBoxOpened) {
		soundListReference.hidden = false;

		beepBoxControls.style.display = 'none';
		beepBoxEditorReference.hidden = true;
	} else {
		soundListReference.hidden = true;

		beepBoxControls.style.display = '';
		beepBoxEditorReference.hidden = false;
	}

	isBeepBoxOpened = !isBeepBoxOpened;
}


// ****************************************************** //
// On Load
// ****************************************************** //
createAllMusicUI();


createTabModal('mainModal');

fetch(browser.runtime.getURL('sites/scratchscript/about.html')).then(response => response.text()).then(response => {
	createModalLayer(response, 'mainModal', 'about');
});

createModalLayer(`
	<h2>Save</h2>
	<i>Saves to a joint location that can be accessed through all projects.</i>

	<br><br>
	<label for='songName'>Song Name:</label>
	<input name='songName' type='text'/>

	<br><br>
	<button class='controls-button'>Save</button>
`, 'mainModal', 'save');

createModalLayer(`
	<h2>Load</h2>
	<i>Loads from a joint location that can be accessed through all projects.</i>

	</br><br>
	<select></select>

	</br><br>
	<button class='controls-button'>Load</button>
`, 'mainModal', 'load');

const saveButton = document.getElementById('mainModal/save').getElementsByClassName('controls-button')[0];
const loadButton = document.getElementById('mainModal/load').getElementsByClassName('controls-button')[0];

saveButton.addEventListener('click', onModalSaveButtonClicked);
loadButton.addEventListener('click', onModalLoadButtonClicked);
