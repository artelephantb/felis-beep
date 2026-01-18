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

async function deleteSong(song) {
	const storage = await browser.storage.local.get();
	const songs = storage['songs'];

	delete songs[song];

	browser.storage.local.set({'songs': songs});
}


getSongs().then(songs => {
	Object.keys(songs).forEach(songKey => {
		const songItem = document.createElement('li');

		songItem.innerHTML = `${songKey} <a href='${beepBoxURL}#${songs[songKey]}'><button>Open in BeepBox</button></a> <button class='delete-button';'>Delete</button><hr>`;

		const deleteButton = songItem.getElementsByClassName('delete-button')[0];
		deleteButton.onclick = () => {
			if (confirm(`Are you shure you want to delete '${songKey}'?`)) {
				deleteSong(songKey);
				songItem.remove();
			}
		};

		songListReference.appendChild(songItem);
	});
});
