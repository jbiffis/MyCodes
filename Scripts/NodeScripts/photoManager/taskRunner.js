require('../constants.js');
var Promise = require("bluebird");
var async = require('async');
var parallelLimit = require('run-parallel-limit');
var fs = require('graceful-fs');
var timer = require('perfy');
const logger = require('winston');
var photosAPI = require('../interfaces/photoJSON.js');

logger.level = 'silly';

var jobInProgress = false;

var taskRunner = function() {
    return {
        start: start,
        jobLoop: jobLoop,
        findNextJob: findNextJob,
        runJob: runJob
    }
}

taskRunner().start();

function start() {
    return photosAPI.init()
        .then(() => {
            setInterval(this.jobLoop, 1000);
        })
}

function jobLoop() {
    if (jobInProgress) return;

    Promise.try(function() {
        return findNextJob();
    }).then(function(task) {
        if (task) {
            jobInProgress = true;
            timer.start('JobTimer');
            return runJob(task);
        } 
        return null
    }).then(function(results) {
        if (!results) return null;
        
        var totalTime = timer.end('JobTimer');

        photosAPI.events.add({
            module: MODULES.TAKS_RUNNER,
            operation: results.job.getProp('operation'),
            event: EVENTS.JOB_COMPLETE,
            data: {
                jobId: results.job.data._id
            },
            execTime: totalTime
        });

        return results.job.markComplete();
    }).then((result) => {
        jobInProgress = false;
    });
}

function findNextJob() {
    return photosAPI.jobs.getNextJob();
}

function runJob(job) {
    var op    = job.getProp("operation");
    var data  = job.getProp("data");

    var taskProcessor = require('../TaskProcessors/'+op+'.js')(photosAPI, job.data._id);

    if (!taskProcessor) {
        logger.error("No task processor found for operation [%s]", op);
        return null;
    }

    return taskProcessor.run(data)
        .then(file => {
            return {file: file, job: job};
        });
}