import WaveList from "../waveList/waveList";
export default class WorkspaceLibrary {

    constructor(params) {

    }

    static create(params) {
        const workspaceLibrary = new WorkspaceLibrary(params);
        return workspaceLibrary.init();
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

    addWorkspaceFileRow(id, name, dateString, fileNum) {
        let row = `<tr>
                        <td> ${name} </td>
                        <td> ${dateString} </td>
                        <td> ${fileNum} </td>
                        <td>
                            <button id="load" class="btn btn-sm btn-default load">Load</button>
                            <button id="delete" class="btn btn-sm btn-default delete">Delete</button>
                        </td>
                   </tr>`;

        let rowObj = $(row).appendTo('#workspace-table > tbody:last-child');
        //let rowObj = $('#audio-table > tbody:last-child').append(row);

        rowObj.data("wid", id);

        let downloadObj = rowObj.find(".load").first();
        downloadObj.click(function() {
            window.location = '/?workspaceId=' + rowObj.data("wid");
        }.bind(this));

        let deleteObj = rowObj.find(".delete").first();
        deleteObj.click(function() {
            this.requestDelete(rowObj.data("wid"));
            rowObj.remove();
        }.bind(this));
    }

    addWorkspaceFileRowOnSelection(id, name, dateString, fileNum) {
        let row = `<tr>
                        <td class="text-center">
                            <input type="radio" name="selected-audio" value=${id}>
                        </td>
                        <td> ${name} </td>
                        <td> ${dateString} </td>
                        <td> ${fileNum} </td>
                   </tr>`;

        let rowObj = $(row).appendTo('#workspace-table > tbody:last-child');
        //let rowObj = $('#audio-table > tbody:last-child').append(row);
        rowObj.click(function() {
            rowObj.find("input[type=radio]").first().prop('checked', true);
        });
        rowObj.data("wid", id);
    }

    requestWorkspaceList(isSelectionMode) {
        $.ajax({
            url: "/user/workspaces",
            type: "GET",
            success: (data) => {
                $('#workspace-table > tbody').html("");
                data.sort(function(a, b) {
                    return new Date(a.updated) - new Date(b.updated);
                });
                console.log(data);
                for (let i = 0; i < data.length; i++) {
                    let info = data[i];
                    let name = info.name;
                    let audioFiles = info.workspaceTrackAudios;
                    let isoDate = info.updated;
                    let dateString = this.matchFormat(this.parseDate(isoDate));
                    if (isSelectionMode) {
                        this.addWorkspaceFileRowOnSelection(info._id, name, dateString, audioFiles.length);
                    } else {
                        this.addWorkspaceFileRow(info._id, name, dateString, audioFiles.length);
                    }
                }
            },
            error: (data) => {
                console.log("error: " +data);
            }
        });
    }

    requestBlobAndLoad(fid, waveList, waveformNum) {
        let xhr = new XMLHttpRequest();
        let url;
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

    requestLoad(wid, waveList, audioLibrary) {
        $.ajax({
            url: "/user/workspace/" + wid,
            type: "GET",
            success: (data) => {
                console.log(data);
                let audioIdList = data.workspaceTrackAudios;
                for (let i = 0; i < audioIdList.length; i++) {
                    waveList.add(waveList.container);
                    audioLibrary.requestBlobAndLoad(audioIdList[i], waveList ,i);
                }
            },
            error: (data) => {
                console.log("error: " +data.message);
            }
        });
    }

    requestDelete(wid) {
        $.ajax({
            url: "/user/workspace/" + wid,
            type: "DELETE",
            success: (data) => {
                console.log(data.message);
            },
            error: (data) => {
                console.log("error: " +data.message);
            }
        });
    }

    requestSave(workspaceName, audioIdList, params) {
        let resBody = {};
        resBody["name"] = workspaceName;
        resBody["workspaceTrackAudios"] =audioIdList;

        $.ajax({
            url: "/user/workspace",
            type: "POST",
            data: resBody,
            success: (data) => {
                console.log(data);
                let waveListModifier = params["waveListModifier"];
                waveListModifier.workspaceId = data["id"];
                WaveList.alertWithSnackbar("Successfuly saved to workspace library");
            },
            error: (data) => {
                console.log("error: " +data);
                WaveList.alertWithSnackbar("Please login before saving to workspace library");
            }
        });
    }
}