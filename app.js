const codeTabReference = document.getElementById('tab:r0:0');
const costumesTabReference = document.getElementById('tab:r0:1');
const soundsTabReference = document.getElementById('tab:r0:2');

const soundsPanelReference = document.getElementById('panel:r0:2');

var currentTab = 0;
var isBeepBoxOpened = false;


function createBeepBoxUI() {
	const soundsEditorReference = document.getElementsByClassName('sound-editor_editor-container_bd-4K')[0];
	if (soundsEditorReference == undefined) {
		setTimeout(createBeepBoxUI, 5);
		return;
	}

	const switchButton = document.createElement('button');
	switchButton.className = 'switch-button';
	switchButton.innerText = 'Switch Mode';

	switchButton.addEventListener('click', onSwitchButtonClicked);


	soundsEditorReference.appendChild(switchButton);
}


function onSwitchButtonClicked() {
	const soundsEditorReference = document.getElementsByClassName('sound-editor_editor-container_bd-4K')[0];

	const soundTitleReference = soundsEditorReference.childNodes[0];
	const soundWaveReference = soundsEditorReference.childNodes[1];
	const soundControlsReference = soundsEditorReference.childNodes[2];


	if (isBeepBoxOpened) {
		soundTitleReference.style.display = '';
		soundWaveReference.style.display = '';
		soundControlsReference.style.display = '';
	} else {
		soundTitleReference.style.display = 'none';
		soundWaveReference.style.display = 'none';
		soundControlsReference.style.display = 'none';
	}

	isBeepBoxOpened = !isBeepBoxOpened;
}

function onTabChanged(newTab) {
	if (newTab == currentTab) return;

	currentTab = newTab;
	if (newTab != 2) return;

	createBeepBoxUI();
}


codeTabReference.addEventListener('click', () => onTabChanged(0));
costumesTabReference.addEventListener('click', () => onTabChanged(1));
soundsTabReference.addEventListener('click', () => onTabChanged(2));

soundsTabReference.getElementsByTagName('span')[0].innerHTML = 'Audio';
