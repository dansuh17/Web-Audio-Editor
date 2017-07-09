var formidable = require('formidable');
var fs = require('fs');
var grid = require('gridfs-stream');
var async = require('async'); 

module.exports = function(app, mongoose, conn, User, Workspace)
{





    ///////////////////
    //USER MANAGEMENT//
    ///////////////////



    //create new user
    app.post('/user', function (req, res) {
        var newuser = new User();
        newuser.username = req.body["username"];
        newuser.password = req.body["password"];

        User.findOne({username: req.body["username"]}, function(err, user){
            if(err) {
                res.status(500).json({
                    result: -1,
                    message: err
                });
                return;
            } else if(!user) {
                newuser.password = newuser.generateHash(newuser.password);
                newuser.save(function(err){
                    if(err) {
                        console.error(err);
                        res.status(500).json({
                            result: -1,
                            message: err
                        });
                        return;
                    }
                    res.status(201).json({
                        result: 1,
                        message: 'successful'
                    });
                });
            } else {
                res.status(404).json({
                    result: 0,
                    message: 'username exists'
                });
                return;
            }
        });
    });

    //login
    app.post('/signin', function (req, res){
        var sess = req.session;

        User.findOne({username: req.body["username"]}, function(err, user){
            if(err) {
                res.status(500).json({
                    result: -1,
                    message: err
                });
                return;
            } else if(!user) {
                res.status(404).json({
                    result: 0,
                    message: 'invalid username'
                });
                return;
            } else if(!user.validateHash(req.body["password"])) {
                res.status(404).json({
                    result: 0,
                    message: 'invalid password'
                });
                return;
            } else {
                sess.username = user.username;
                res.status(200).json({
                    result: 1,
                    message: 'successful'
                });
            }
        });
    });

    //logout
    app.get('/signout', function (req, res){
        var sess = req.session;
        if(sess.username){
            req.session = null;
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //check the status of user
    app.get('/checkstatus', (req, res) => {
        if(typeof req.session.username === "undefined") {
            return res.status(401).json({
                error: 1
            });
        }
        res.json({ username: req.session.username});
    });





    ////////////////////
    //AUDIO MANAGEMENT//
    ////////////////////



    //upload new audio to user's data space
    app.post('/audio', function (req, res) {
        var sess = req.session;
        if(sess.username){
            var form = new formidable.IncomingForm();
            var fid;
            form.parse(req, function (err, fields, files) {
                if (!err) {
                    console.log('Files Uploaded: ' + files.file)
                    grid.mongo = mongoose.mongo;
                    var gfs = grid(conn.db);
                    var writestream = gfs.createWriteStream({
                        filename: files.file.name
                    });
                    fs.createReadStream(files.file.path).pipe(writestream);
                    fid = writestream.id;
                }
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                }
            });
            form.on('end', function (err) {
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else {
                    User.findOne({username: sess.username}, function(err, user){
                        if(err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        } else if(!user) {
                            res.status(500).json({
                                result: -1,
                                message: 'error'
                            });
                            return;
                        } else {
                            user.audioIDs.push(fid);
                            user.save(function(err){
                                if(err) {
                                    console.error(err);
                                    res.status(500).json({
                                        result: -1,
                                        message: err
                                    });
                                    return;
                                }
                                res.status(201).json({
                                    result: 1,
                                    message: 'successful',
                                    audio_id: fid
                                });
                            });
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //upload new audio to user's data space
    app.post('/temp/audio', function (req, res) {
        var sess = req.session;
        if(sess.username){
            var form = new formidable.IncomingForm();
            var fid;
            form.parse(req, function (err, fields, files) {
                if (!err) {
                    console.log('Files Uploaded: ' + files.file)
                    grid.mongo = mongoose.mongo;
                    var gfs = grid(conn.db);
                    var writestream = gfs.createWriteStream({
                        filename: files.file.name
                    });
                    fs.createReadStream(files.file.path).pipe(writestream);
                    fid = writestream.id;
                }
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                }
            });
            form.on('end', function (err) {
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else {
                    User.findOne({username: sess.username}, function(err, user){
                        if(err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        } else if(!user) {
                            res.status(500).json({
                                result: -1,
                                message: 'error'
                            });
                            return;
                        } else {
                            user.tempIDs.push(fid);
                            user.save(function(err){
                                if(err) {
                                    console.error(err);
                                    res.status(500).json({
                                        result: -1,
                                        message: err
                                    });
                                    return;
                                }
                                res.status(201).json({
                                    result: 1,
                                    message: 'successful',
                                    audio_id: fid
                                });
                            });
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //download audiofile
    app.get('/audio/:_id', function (req, res) {
        var sess = req.session;
        if(sess.username){
            grid.mongo = mongoose.mongo;
            var gfs = grid(conn.db);
            var fid = req.params._id;
            gfs.exist({ _id: fid }, function(err, found) {
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if (!found) {
                    res.status(404).json({
                        result: 0,
                        message: 'invalid audio fileID'
                    });
                    return;
                } else {
                    gfs.createReadStream({ _id: fid }).pipe(res);
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //delete audiofile
    app.delete('/audio/:_id', function (req, res) {
        var sess = req.session;
        if(sess.username){
            grid.mongo = mongoose.mongo;
            var gfs = grid(conn.db);
            var fid = req.params._id;
            gfs.exist({ _id: fid }, function(err, found) {
                if (err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if (!found) {
                    res.status(404).json({
                        result: 0,
                        message: 'invalid audio fileID'
                    });
                    return;
                } else {
                    gfs.remove({ _id: fid }, function (err) {
                        if (err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            }); 
                            return;
                        } else {
                            User.findOne({username: sess.username}, function(err, user){
                                if(err) {
                                    res.status(500).json({
                                        result: -1,
                                        message: err
                                    });
                                    return;
                                } else if(!user) {
                                    res.status(500).json({
                                        result: -1,
                                        message: 'error'
                                    });
                                    return;
                                } else {
                                    var idx = user.audioIDs ? user.audioIDs.indexOf(fid) : -1;
                                    if (idx !== -1){
                                        user.audioIDs.splice(idx, 1);
                                        user.save(function(err){
                                            if(err) {
                                                console.error(err);
                                                res.status(500).json({
                                                    result: -1,
                                                    message: err
                                                });
                                                return;
                                            }
                                            res.status(200).json({
                                                result: 1,
                                                message: 'successful'
                                            });
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //get list of audio files of user
    app.get('/user/audio', function (req, res) {
        var items = [];
        var sess = req.session;
        if(sess.username){
            User.findOne({username: sess.username}, function(err, user){
                if(err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if(!user) {
                    res.status(404).json({
                        result: -1,
                        message: 'no user'
                    });
                    return;
                } else {
                    var fidArray = user.audioIDs;
                    async.forEachOf(fidArray, function (value, key, callback){
                        conn.db.collection('fs.files').findOne({'_id': value}, function(err, item) {
                            if (err) {
                                return callback(err);
                            } else {
                                items.push(item);
                            }
                            callback();
                        });
                    }, function(errs) {
                        if (err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        } else {
                            res.status(200).json(items);
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });
    




    ////////////////////////
    //WORKSPACE MANAGEMENT//
    ////////////////////////



    //create new workspace
    app.post('/user/workspace', function (req, res) {
        var sess = req.session;
        if(sess.username){
            var newworkspace = new Workspace();
            newworkspace.name = req.body["name"];
            newworkspace.workspaceTrackAudios = req.body["workspaceTrackAudios[]"];
            newworkspace.save(function(err, workspace){
                if(err) {
                    console.error(err);
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                }
                User.findOne({username: sess.username}, function(err, user){
                    if(err) {
                        res.status(500).json({
                            result: -1,
                            message: err
                        });
                        return;
                    } else if(!user) {
                        res.status(500).json({
                            result: -1,
                            message: 'error'
                        });
                        return;
                    } else {
                        let objId = mongoose.Types.ObjectId(workspace.id);
                        user.workspaceIDs.push(objId);
                        user.save(function(err){
                            if(err) {
                                console.error(err);
                                res.status(500).json({
                                    result: -1,
                                    message: err
                                });
                                return;
                            }
                            res.status(201).json({
                                result: 1,
                                id: objId,
                                message: 'successful'
                            });
                        });
                    }
                });
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //modify existing workspace
    app.put('/user/workspace', function (req, res) {
        var sess = req.session;
        if(sess.username){
            Workspace.findOne({_id: req.body["id"]}, function(err, workspace){
                if(err) {
                    console.error(err);
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if (!workspace) {
                    res.status(404).json({
                        result: -1,
                        message: 'invalid workspace id'
                    });
                    return;
                } else {
                    workspace.workspaceTrackAudios = req.body["workspaceTrackAudios"];
                    workspace.updated = new Date();
                    workspace.save(function(err){
                        if(err) {
                            console.error(err);
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        }
                        res.status(200).json({
                            result: 1,
                            message: 'successful'
                        })
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //get the data of workspace
    app.get('/user/workspace/:_id', function (req, res) {
        var sess = req.session;
        if(sess.username){
            Workspace.findOne({_id: req.params._id}, function(err, workspace){
                if(err) {
                    console.error(err);
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if (!workspace) {
                    console.log(new ObjectId(req.body["id"]))
                    res.status(404).json({
                        result: -1,
                        message: 'invalid workspace id'
                    });
                    return;
                } else {
                        res.status(200).json({
                            result: 1,
                            message: 'successful',
                            workspaceTrackAudios: workspace.workspaceTrackAudios
                        });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //delete the existing workspace    
    app.delete('/user/workspace/:_id', function (req, res) {
        var sess = req.session;
        if(sess.username){
            Workspace.remove({_id: req.params._id}, function(err){
                if(err) {
                    console.error(err);
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else {
                    User.findOne({username: sess.username}, function(err, user){
                        if(err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        } else if(!user) {
                            res.status(500).json({
                                result: -1,
                                message: 'error'
                            });
                            return;
                        } else {
                            var idx = user.workspaceIDs ? user.workspaceIDs.indexOf(req.params._id) : -1;
                            console.log(idx);
                            if (idx !== -1){
                                user.workspaceIDs.splice(idx, 1);
                                user.save(function(err){
                                    if(err) {
                                        console.error(err);
                                        res.status(500).json({
                                            result: -1,
                                            message: err
                                        });
                                        return;
                                    }
                                    res.status(200).json({
                                        result: 1,
                                        message: 'successful'
                                    });
                                });
                            }
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

    //get the metadata of workspaces that the user has
    app.get('/user/workspaces', function (req, res) {
        var items = [];
        var sess = req.session;
        if(sess.username){
            User.findOne({username: sess.username}, function(err, user){
                if(err) {
                    res.status(500).json({
                        result: -1,
                        message: err
                    });
                    return;
                } else if(!user) {
                    res.status(404).json({
                        result: -1,
                        message: 'no user'
                    });
                    return;
                } else {
                    var widArray = user.workspaceIDs;
                    async.forEachOf(widArray, function (value, key, callback){
                        Workspace.findOne({'_id': value}, function(err, item) {
                            if (err) {
                                return callback(err);
                            } else {
                                items.push(item);
                            }
                            callback();
                        });
                    }, function(errs) {
                        if (err) {
                            res.status(500).json({
                                result: -1,
                                message: err
                            });
                            return;
                        } else {
                            res.status(200).json(items);
                        }
                    });
                }
            });
        } else {
            res.redirect('/'); // TODO: NEED TO BE CONSIDERED
        }
    });

}
