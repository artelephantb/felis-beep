const songListReference = document.getElementById('songList');

const beepBoxURL = 'https://www.beepbox.co';


async function getSongs() {
	let songs = [];

	try {
		const storage = await browser.storage.local.get();
		songs = storage['songs'];
	} catch (error) {}

	return songs;
}

getSongs().then(songs => {
	Object.keys(songs).forEach(songKey => {
		const songItem = document.createElement('li');

		songItem.innerHTML = `${songKey}<a href='${beepBoxURL}#${songs[songKey]}'> <button>Open in BeepBox</button><hr>`;

		songListReference.appendChild(songItem);
	});
});
