import WaveList from "../waveList/waveList";
export default class AudioLibrary {

    constructor(params) {

    }

    static create(params) {
        const audioLibrary = new AudioLibrary(params);
        return audioLibrary.init();
    }

    init() {
        return this;
    }

    roundUp(num, precision) {
        return Math.ceil(num * precision) / precision;
    }

    parseDate(date_str) {
        var date_time = date_str.split("T");
        const [year, month, day] = date_time[0].split('-');
        const [hour, min, second] = date_time[1].replace("Z", "").split(':');

        return new Date(year, month-1, day, hour, min, second);
    }

    matchFormat(date) {
        let year = date.getFullYear();
        let month = date.getMonth()+1;
        let day = date.getDate();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let dateString = year + "." + month + "." + day + " " + ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2);
        return dateString;
    }

    addAudioFileRow(id, filename, dateString, filesize) {
        let row = `<tr>
                        <td> ${filename} </td>
                        <td> ${dateString} </td>
                        <td> ${filesize}MB </td>
                        <td>
                            <button id="download" class="btn btn-sm btn-default download">Download</button>
                            <button id="delete" class="btn btn-sm btn-default delete">Delete</button>
                        </td>
                   </tr>`;

        let rowObj = $(row).appendTo('#audio-table > tbody:last-child');
        //let rowObj = $('#audio-table > tbody:last-child').append(row);

        let filenameToken = filename.split(".");
        let extension = filenameToken[filenameToken.length - 1];
        rowObj.data("fid", id);

        let downloadObj = rowObj.find(".download").first();
        downloadObj.click(function() {
            this.requestDownload(rowObj.data("fid"), extension);
        }.bind(this));

        let deleteObj = rowObj.find(".delete").first();
        deleteObj.click(function() {
            this.requestDelete(rowObj.data("fid"));
            rowObj.remove();
        }.bind(this));
    }

    addAudioFileRowOnSelection(id, filename, dateString, filesize) {
        let row = `<tr>
                        <td class="text-center">
                            <input type="radio" name="selected-audio" value=${id}>
                        </td>
                        <td> ${filename} </td>
                        <td> ${dateString} </td>
                        <td> ${filesize}MB </td>
                   </tr>`;

        let rowObj = $(row).appendTo('#audio-table > tbody:last-child');
        //let rowObj = $('#audio-table > tbody:last-child').append(row);
        rowObj.click(function() {
            rowObj.find("input[type=radio]").first().prop('checked', true);
        });
        rowObj.data("fid", id);
    }

    requestAudioList(isSelectionMode) {
        $.ajax({
            url: "/user/audio",
            type: "GET",
            success: (data) => {
                data.sort(function(a, b) {
                    return new Date(a.uploadDate) - new Date(b.uploadDate);
                });
                $('#audio-table > tbody').html("");
                for (let i = 0; i < data.length; i++) {
                    let info = data[i];
                    let filename = info.filename;
                    let filesize = info.length / 1000 / 1000;
                    filesize = this.roundUp(filesize, 100);
                    let isoDate = info.uploadDate;
                    let dateString = this.matchFormat(this.parseDate(isoDate));
                    if (isSelectionMode) {
                        this.addAudioFileRowOnSelection(info._id, filename, dateString, filesize);
                    } else {
                        this.addAudioFileRow(info._id, filename, dateString, filesize);
                    }
                }
            },
            error: (data) => {
                console.log("error: " +data);
            }
        });
    }

    requestDownload(fid, ext) {
        let xhr = new XMLHttpRequest();
        let url;
        xhr.addEventListener('load', function(blob) {
            if (xhr.status == 200) {
                url = window.URL.createObjectURL(xhr.response);
                this.downloadAudioFileFromUrl(url, "audio_file" + "." + ext);
            }
        }.bind(this));

        let src = "/audio/" + fid;
        xhr.open('GET', src);
        xhr.responseType = 'blob';
        xhr.send(null);
    }

    requestBlobAndLoad(fid, waveList, waveformNum) {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(blob) {
            if (xhr.status == 200) {
                let blobObject = xhr.response;
                waveList.wavesurfers[waveformNum].loadBlob(blobObject);
            }
        }.bind(this));

        let src = "/audio/" + fid;
        xhr.open('GET', src);
        xhr.responseType = 'blob';
        xhr.send(null);
    }

    /* Referred https://stackoverflow.com/questions/23451726/saving-binary-data-as-file-using-javascript-from-a-browser
     * http://tech.chitgoks.com/2015/09/12/download-mp3-stream-via-ajax-then-load-to-html5-audio/
     */
    downloadAudioFileFromUrl(url, name) {
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    requestDelete(fid) {
        $.ajax({
            url: "/audio/" + fid,
            type: "DELETE",
            success: (data) => {
                console.log(data.message);
            },
            error: (data) => {
                console.log("error: " +data.message);
            }
        });
    }

    static requestSave(audioFile, filename, isTemp, params) {
        console.log(audioFile);
        console.log(filename);
        let formData = new FormData();
        formData.append("file", audioFile, filename);

        let url;
        if (isTemp) {
            url = "/temp/audio";
        } else {
            url = "/audio";
        }

        $.ajax({
            url: url,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: (data) => {
                console.log(data);
                console.log(data["audio_id"]);
                if (isTemp) {
                    let waveformNum = params["waveformNum"];
                    $("#waveRow" + waveformNum).data("tempId", data["audio_id"]);
                    let modifier = params["waveListModifier"];
                    modifier.leftSaveCall--;
                    modifier.saveWorkspaceCallback();
                }
                WaveList.alertWithSnackbar("Successfuly saved to audio library");
            },
            error: (data) => {
                console.log("error: " +data);
                WaveList.alertWithSnackbar("Please login before saving to audio library");
            }
        });
    }

    bindUpload() {
        let library = this;
        $("#upload-audio").on("change", function (){
            let audioFile = this.files[0];
            let formData = new FormData();
            formData.append("file", audioFile);

            $.ajax({
                url: "/audio",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: (data) => {
                    console.log(data);
                    let filename = audioFile.name;
                    let filesize = audioFile.size / 1000 / 1000;
                    filesize = library.roundUp(filesize, 100);

                    let date = new Date();
                    let year = date.getFullYear();
                    let month = date.getMonth()+1;
                    let day = date.getDate();
                    let hours = date.getHours();
                    let minutes = date.getMinutes();
                    let dateString = year + "." + month + "." + day + " " + hours + ":" + minutes;
                    library.addAudioFileRow(data.audio_id, filename, dateString, filesize);
                },
                error: (data) => {
                    console.log("error: " +data);
                }
            });
        });
    }
}