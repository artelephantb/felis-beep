const elementTranslations = {
	tab0: 'tab:r0:0',
	tab1: 'tab:r0:1',
	tab2: 'tab:r0:2',

	panel0: 'panel:r0:0',
	panel1: 'panel:r0:1',
	panel2: 'panel:r0:2',

	panelEditArea: 'sound-editor_editor-container_bd-4K',

	actionMenuButtons: 'action-menu_more-button_3chvL',
	importActionFileInput: 'action-menu_file-input_+rlXQ'
}

const codeTabReference = document.getElementById(elementTranslations['tab0']);
const costumesTabReference = document.getElementById(elementTranslations['tab1']);
const soundsTabReference = document.getElementById(elementTranslations['tab2']);

const soundsPanelReference = document.getElementById(elementTranslations['panel2']);

var currentTab = 0;
var isBeepBoxOpened = false;


async function createSoundLayerFromURL(url, name) {
	const importButton = document.getElementsByClassName(elementTranslations['actionMenuButtons'])[0];
	const importInput = importButton.getElementsByClassName(elementTranslations['importActionFileInput'])[0];

	const soundBlob = await fetch(url).then(response => response.blob());
	const soundFile = new File([soundBlob], name + '.wav', {type: 'audio/wav'});
	const files = [soundFile];

	const importFiles = new DataTransfer();
	files.forEach(file => {
		importFiles.items.add(file);
	});

	importInput.files = importFiles.files;
	importInput.dispatchEvent(new Event('change', {bubbles: true}));
}


function createModal(html, id) {
	const modal = document.createElement('div');

	modal.id = id;
	modal.className = 'modal';


	modal.innerHTML = `
	<div class='modal-box'>
		<button class='close'>&times;</button>
		<div class='modal-inside'></div>
	</div>
	`;


	const inside = modal.getElementsByClassName('modal-inside')[0];
	inside.innerHTML = html;

	const closeButton = modal.getElementsByClassName('close')[0];
	closeButton.onclick = () => {
		modal.style.display = 'none';
	};


	document.body.appendChild(modal);
}


function createEditor(placement) {
	const beepBoxEditor = document.createElement('iframe');
	beepBoxEditor.id = 'beepBoxEditor';

	beepBoxEditor.src = browser.runtime.getURL('beepbox/app.html');
	beepBoxEditor.height = 600;

	beepBoxEditor.style.background = 'var(--editor-background)';
	beepBoxEditor.style.border = 'none';
	beepBoxEditor.style.borderRadius = '5px';

	beepBoxEditor.hidden = true;

	placement.appendChild(beepBoxEditor);
}

function createControls(placement) {
	const controls = document.createElement('div');
	controls.id = 'beepBoxControls';

	controls.innerHTML = `
		<button class='controls-button' id='beepBoxBuildButton'>&#9874; Build</button>
		<button class='controls-button' id='beepBoxAboutButton'>&starf; About</button>
	`;

	controls.className = 'controls';
	controls.style.display = 'none';

	placement.appendChild(controls);

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
	const soundsEditorReference = document.getElementsByClassName(elementTranslations['panelEditArea'])[0];
	if (soundsEditorReference == undefined) {
		setTimeout(createAllMusicUI, 5);
		return;
	}

	createEditor(soundsEditorReference);
	createControls(soundsEditorReference);
	createSwitchButton(soundsEditorReference);
}


async function onBuildButtonClicked() {
	const contentWindow = document.getElementById('beepBoxEditor').contentWindow;
	const soundURL = await contentWindow.eval('_exportToWav')();

	createSoundLayerFromURL(soundURL, 'New Song');
}

function onAboutButtonClicked() {
	document.getElementById('aboutModal').style.display = 'flex';
}

function onSwitchButtonClicked() {
	const soundsEditorReference = document.getElementsByClassName(elementTranslations['panelEditArea'])[0];

	const soundTitleReference = soundsEditorReference.childNodes[0];
	const soundWaveReference = soundsEditorReference.childNodes[1];
	const soundControlsReference = soundsEditorReference.childNodes[2];

	const beepBoxControls = document.getElementById('beepBoxControls');
	const beepBoxEditorReference = document.getElementById('beepBoxEditor');


	if (isBeepBoxOpened) {
		soundTitleReference.style.display = '';
		soundWaveReference.style.display = '';
		soundControlsReference.style.display = '';

		beepBoxControls.style.display = 'none';

		beepBoxEditorReference.hidden = true;
	} else {
		soundTitleReference.style.display = 'none';
		soundWaveReference.style.display = 'none';
		soundControlsReference.style.display = 'none';

		beepBoxControls.style.display = '';

		beepBoxEditorReference.hidden = false;
	}

	isBeepBoxOpened = !isBeepBoxOpened;
}

function onTabChanged(newTab) {
	if (newTab == currentTab) return;

	currentTab = newTab;
	if (newTab != 2) return;

	createAllMusicUI();
}


codeTabReference.addEventListener('click', () => onTabChanged(0));
costumesTabReference.addEventListener('click', () => onTabChanged(1));
soundsTabReference.addEventListener('click', () => onTabChanged(2));

soundsTabReference.getElementsByTagName('span')[0].innerHTML = 'Audio';


createModal(`
	<div>
		<h2>Felis Beep</h2>
		<i>Felis Beep</i> is an extension for <a href='https://www.firefox.com' target='_blank'>Firefox</a>, to add <a href='https://beepbox.co' target='_blank'>BeepBox</a> into <a href='https://scratch.mit.edu' target='_blank'>Scratch</a>!

		<h2>License</h2>
		<i>BeepBox</i> (beepbox directory and colors in main.css) are under the MIT license (see beepbox-license.txt) and the rest of the project is also under the MIT license (see license.txt).

		<h2>Notice</h2>
		<i>Felis Beep</i> is in no way affiliated nor endorsed by BeepBox, Scratch, the Scratch Foundation, or the Scratch Team.

		<i>Scratch</i> is developed by the Lifelong Kindergarten Group at the MIT Media Lab. See the <a href='https://scratch.mit.edu' target='_blank'>Scratch Website</a>.
	</div>
`, 'aboutModal');
