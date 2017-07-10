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
var checkInterval = [1, 2, 5, 10,30, 60, 90, 180];
var checkPos = 0;

var taskRunner = function() {
    return {
        start: start,
        jobLoop: jobLoop,
        findNextJob: findNextJob,
        runJob: runJob
    }
}

taskRunner().start();

var interval;

function start() {
    return photosAPI.init()
        .then(() => {
            checkTimer();
        })
}

function checkTimer() {
    jobInProgress = false;

    var waitTime = checkInterval[checkPos];

    logger.debug("Waiting to check new jobs in %d seconds", waitTime);
    setTimeout(jobLoop, waitTime*1000);

    checkPos = Math.min(++checkPos, checkInterval.length-1);
}

function pauseLoop() {
    jobInProgress = true;
}

function jobLoop() {
    Promise.try(function() {
        return findNextJob();
    }).then(function(task) {
        if (task) {
            pauseLoop();
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

        checkPos = 0;
        return results.job.markComplete();
    }).finally((result) => {
        checkTimer();
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
        // TODO This should log the error and continue
        logger.error("No task processor found for operation [%s]", op);
        return null;
    }

    return taskProcessor.run(data)
        .then(file => {
            return {file: file, job: job};
        });
}