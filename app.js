const codeTabReference = document.getElementById('tab:r0:0');
const costumesTabReference = document.getElementById('tab:r0:1');
const soundsTabReference = document.getElementById('tab:r0:2');

var currentTab = 0;


function onTabChanged(newTab) {
	if (newTab == currentTab) return;

	currentTab = newTab;
	if (newTab == 0) {
		alert('Code tab pressed!');
	} else if (newTab == 1) {
		alert('Costumes tab pressed!');
	} else if (newTab == 2) {
		alert('Audio tab pressed!');
	} else {
		alert('Unknown tab');
	}
}


codeTabReference.addEventListener('click', () => onTabChanged(0));
costumesTabReference.addEventListener('click', () => onTabChanged(1));
soundsTabReference.addEventListener('click', () => onTabChanged(2));

soundsTabReference.getElementsByTagName('span')[0].innerHTML = 'Audio';
