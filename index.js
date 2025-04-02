import { songs } from './songs.js';

const audio = document.querySelector('#audio');
const cdCover = document.querySelector('#cdCover');
const audioName = document.querySelector('.name');
const audioArtist = document.querySelector('.artist');
const progress = document.querySelector('#progress');
const currentTime = document.querySelector('.current-time');
const totalTime = document.querySelector('.total-time');
const playBtn = document.querySelector('.fa-circle-play');
const pauseBtn = document.querySelector('.fa-circle-pause');
const nextBtn = document.querySelector('.fa-forward-step');
const prevBtn = document.querySelector('.fa-backward-step');
const playlistBtn = document.querySelector('.fa-list');
const playlistWrap = document.querySelector('.playlist');
const lyricsWrap = document.querySelector('.lyrics');
const muteBtn = document.querySelector('.fa-volume-low');

const app = {
  songs: songs,
  currentTrack: 0,
  playlistItems: [],
  handlePlayMusic: function () {
    audio.addEventListener('loadedmetadata', () => {
      totalTime.textContent = this.convertTime(audio.duration);
    });

    playBtn.addEventListener('click', () => audio.play());
    pauseBtn.addEventListener('click', () => audio.pause());

    audio.addEventListener('playing', () => {
      playBtn.classList.remove('active');
      pauseBtn.classList.add('active');
      audio.addEventListener('timeupdate', () => {
        currentTime.textContent = this.convertTime(audio.currentTime);
        let percent = this.convertPercent(audio.currentTime, audio.duration);
        progress.value = percent;
        progress.style.backgroundSize = `${percent}% 100%`;
      });
    });

    audio.addEventListener('pause', () => {
      playBtn.classList.add('active');
      pauseBtn.classList.remove('active');
    });

    progress.addEventListener('input', (e) => {
      let time = Math.floor((e.target.value * audio.duration) / 100);
      this.seekTo(time);
    });

    playlistBtn.addEventListener('click', () => {
      playlistWrap.classList.toggle('active');
    });

    this.playlistItems.forEach((element) => {
      element.addEventListener('click', () => {
        this.currentTrack = element.dataset.id;
        this.loadSong(this.songs, this.currentTrack);
        audio.play();
        playlistWrap.classList.toggle('active');
      });
    });
    nextBtn.addEventListener('click', () => {
      this.nextSong(this.songs, this.currentTrack);
      audio.play();
    });
    prevBtn.addEventListener('click', () => {
      this.prevSong(this.songs, this.currentTrack);
      audio.play();
    });
    muteBtn.addEventListener('click', () => {
      muteBtn.classList.toggle('muted');
      audio.muted = audio.muted ? false : true;
    });
  },

  convertTime: function (time) {
    let seconds = Math.floor(time % 60);
    let minutes = Math.floor(time / 60);
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${minutes}:${seconds}`;
  },

  convertPercent: function (curr, total) {
    let percent = Math.floor((curr * 100) / total);
    return percent;
  },

  renderPlaylist: function (songs) {
    const htmls = songs.map((song, index) => {
      return `
            <div class="playlist-item" data-id="${index}">
                    <img src="${song.image}">
                    <div class="playlist-info">
                        <p>${song.name}</p>
                        <span>${song.artist}</span>
                    </div>
                </div>
            `;
    });
    playlistWrap.innerHTML = htmls.join('');
    this.playlistItems = document.querySelectorAll('.playlist-item');
  },

  renderLyrics: function (songs, trackId) {
    const htmls = songs[trackId].lyrics.map((item) => {
      return `
            <li class="lyric-item">${item}</li>
            `;
    });
    lyricsWrap.innerHTML = htmls.join('');
  },

  loadSong: function (songs, trackId) {
    audio.src = songs[trackId].path;
    cdCover.src = songs[trackId].image;
    audioArtist.textContent = songs[trackId].artist;
    audioName.textContent = songs[trackId].name;
    this.renderLyrics(songs, trackId);
  },

  nextSong: function (songs, trackId) {
    trackId++;
    if (trackId >= songs.length) {
      trackId = 0;
    }
    this.currentTrack = trackId;
    this.loadSong(songs, trackId);
  },

  prevSong: function (songs, trackId) {
    trackId--;
    if (trackId < 0) {
      trackId = songs.length - 1;
    }
    this.currentTrack = trackId;
    this.loadSong(songs, trackId);
  },

  seekTo: function (time) {
    audio.currentTime = time;
  },

  visualizer: function (audio) {
    let context = new AudioContext();
    let src = context.createMediaElementSource(audio);
    let analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 2048;
    let bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    function getAverageEnergy() {
      analyser.getByteTimeDomainData(dataArray);
      const sum = dataArray.reduce((acc, value) => acc + value);
      return sum / bufferLength;
    }

    function getEnergyScale() {
      const energy = getAverageEnergy();
      const scaledValue = Math.min(255, Math.max(0, Math.floor((energy / 255) * 256)));
      return scaledValue;
    }

    function scaleImage() {
      const scaledValue = getEnergyScale();
      const sacleFactor = scaledValue / 255 + 0.5;
      cdCover.style.transform = `scale(${sacleFactor})`;
    }

    function update() {
      requestAnimationFrame(update);
      scaleImage();
    }
    update();

    audio.addEventListener('playing', () => {
      context.resume();
    });

    audio.addEventListener('ended', () => {
      this.nextSong(this.songs, this.currentTrack);
      audio.play();
    });

    audio.addEventListener('pause', () => {
      context.suspend();
    });
  },

  start: function () {
    this.renderPlaylist(this.songs);
    this.loadSong(this.songs, this.currentTrack);
    this.visualizer(audio);
    this.handlePlayMusic();
  },
};

app.start();
