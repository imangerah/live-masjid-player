angular.module('Player.player', ['ngRoute'])
    .config(['$routeProvider', ($routeProvider) => {
        $routeProvider
            .when('/player', {
                templateUrl: 'player/player.html', controller: 'Playerctrl'
            })
    }])
    .controller('Playerctrl', ['$scope', '$location', function ($scope, $location) {
        $scope.musicSelected = false;
        $scope.trackName = null;
        $scope.songList = null;
        $scope.songPlaying = false;
        $scope.playListVisible = false;
        $scope.mute = false;
        $scope.howl = null;

        var slider = document.getElementById("myRange");

        const ipc = require('electron').ipcRenderer;
        const fs = require('fs');


        $scope.refreshStreams = function refreshStreams() {
            fs.readFile('app/data/streams.json', 'utf8', async function (err, data) {
                if (err) throw err;
                let obj = JSON.parse(data);
                console.table(obj);
                let onlineStreamIds = await refreshOnlineStreams() || [];

                let onlineStreams = obj.filter((item) => {
                    return onlineStreamIds.indexOf(item.id) > -1;
                }).map(item => {
                    item.online = true;
                    return item;
                });

                let offlineStreams = obj.filter((item) => {
                    return onlineStreamIds.indexOf(item.id) === -1;
                });
                console.log(onlineStreams);
                startPlayer(onlineStreams.concat(offlineStreams));


            });
        }

        $scope.refreshStreams();

        async function refreshOnlineStreams() {

            let response;
            try {
                let poll_url = 'http://livemasjid.com:8000/status-json.xsl';

                const axios = require('axios');

                response = await axios({url: poll_url, method: 'get', timeout: 10000}).then(response => {

                    if (response.status === 200) {
                        return response.data;
                    } else {
                        return undefined;
                    }
                });
            } catch (e) {
                return undefined;
            }

            let onlineStreams = [];

            if (response !== undefined) {

                onlineStreams = response.icestats.source.map((stream) => {
                    return stream.listenurl.substr(stream.listenurl.lastIndexOf("/") + 1);
                });

            }
            return onlineStreams;
        }

        function startPlayer(arg) {
            let streamNames = arg.map((stream) => {
                return stream.title;
            });


            if ($scope.songPlaying) {
                $scope.songPlaying = false;
                $scope.player.pause();
            }

            $scope.songList = {
                files: streamNames,
                path: '/tmp'
            };

            var songArr = arg.map((stream) => {
                return {
                    title: stream.title,
                    file: stream.url,
                    name: stream.title,
                    id: stream.id,
                    online: stream.online || false,
                }
            });

            $scope.player = new Player(songArr);
            $scope.musicSelected = true;
            $scope.$apply()

            // document.getElementById('picture').style.display = "block";
            // document.getElementById('picture').setAttribute('src', img);
        }

        $scope.playPlaylistSong = function (index) {
            $scope.player.play(index);
        }

        $scope.nextSong = function () {
            $scope.player.skip('next');
            $scope.songPlaying = true;
        };

        $scope.prevSong = function () {
            $scope.player.skip('prev');
            $scope.songPlaying = true;
        }

        $scope.showPlaylist = function () {
            $scope.playListVisible = !$scope.playListVisible;
        };

        $scope.playMusic = function () {
            if ($scope.songPlaying) {
                $scope.songPlaying = false;
                $scope.player.pause();
            }
            else {
                $scope.songPlaying = true;
                $scope.player.play();
            }
        }

        $scope.togglecheckbox = function () {
            if ($scope.mute) {
                $scope.mute = false;
                $scope.player.volume(slider.value / 100);
            }
            else {
                $scope.mute = true;
                $scope.player.volume(0);
            }
        }

        slider.oninput = function () {
            var val = slider.value / 100;
            $scope.player.volume(val);
            $scope.mute = false;
        }

        var Player = function (playlist) {
            this.playlist = playlist;
            this.index = 0;
        }

        Player.prototype = {

            play: function (index) {
                var self = this;
                var sound;

                index = typeof index === 'number' ? index : self.index;
                var data = self.playlist[index];
                $scope.trackName = data.name;
                $scope.trackArtist = "Live Stream";

                if ($scope.howl) {
                    $scope.howl.stop();
                    $scope.songPlaying = false;
                    $scope.howl.unload();
                    $scope.howl = null;
                }

                $scope.howl = new Howl({
                    src: [data.file],
                    html5: true,
                    onend: function () {
                        self.skip('right');
                    }
                });

                $scope.howl.play();
                $scope.songPlaying = true;

                self.index = index;
            },

            pause: function () {
                $scope.howl.pause();
            },

            skip: function (direction) {
                var self = this;

                var index = 0;
                if (direction === 'prev') {
                    index = self.index - 1;
                    if (index < 0) {
                        index = self.playlist.length - 1;
                    }
                }
                else if (direction === 'random') {
                    index = Math.floor(Math.random() * self.playlist.length) + 1;
                    console.log(index);

                }
                else {
                    index = self.index + 1;
                    if (index >= self.playlist.length) {
                        index = 0;
                    }
                }

                self.skipTo(index);
            },

            skipTo: function (index) {
                var self = this;

                if ($scope.howl) {
                    $scope.howl.stop();
                }

                if (!$scope.songPlaying) {
                    $scope.songPlaying = true;
                    self.play(index);
                }
                else
                    self.play(index);
            },
            volume: function (val) {
                var self = this;

                // Update the global volume (affecting all Howls).
                Howler.volume(val);

            }
        }
    }])
