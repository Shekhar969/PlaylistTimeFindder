async function analyzePlaylist() {
    const apiKey = 'AIzaSyBeBg0oUz7rW4ZcxGuvg5jboqZKMx9yIGM'; // Your API key
    const playlistUrl = document.getElementById('playlistUrl').value;
    const playlistId = playlistUrl.split('list=')[1];

    if (!playlistId) {
        document.getElementById('result').innerHTML = 'Invalid playlist URL.';
        return;
    }

    let videoCount = 0;
    let totalDuration = 0;
    let videoLinks = '';

    const fetchPlaylistItems = async (pageToken = '') => {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${pageToken}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            document.getElementById('result').innerHTML = `Error: ${data.error.message}`;
            return;
        }

        // Increment video count
        videoCount += data.items.length;

        // Fetch video durations and prepare links for the current page
        const videoIds = data.items.map(item => item.contentDetails.videoId).join(',');
        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
        );
        const videoData = await videoResponse.json();

        videoData.items.forEach(video => {
            const duration = video.contentDetails.duration;
            totalDuration += parseISO8601Duration(duration);
        });

        // Prepare video links
        data.items.forEach(item => {
            const title = item.snippet.title;
            const videoId = item.contentDetails.videoId;
            videoLinks += `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="video-link">${title}</a>`;
        });

        // Fetch the next page if available
        if (data.nextPageToken) {
            await fetchPlaylistItems(data.nextPageToken);
        }
    };

    const parseISO8601Duration = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    };

    try {
        await fetchPlaylistItems();

        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        const seconds = totalDuration % 60;

        document.getElementById('result').innerHTML = `
            <strong>Total Videos:</strong> ${videoCount}<br>
            <strong>Total Duration:</strong> ${hours} hours, ${minutes} minutes, ${seconds} seconds<br><br>
            <strong>Video Links:</strong><br>
            ${videoLinks}
        `;
    } catch (error) {
        document.getElementById('result').innerHTML = 'Error fetching playlist data.';
        console.error(error);
    }
}