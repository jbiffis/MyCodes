require('../constants.js');
var cron = require('node-cron');
var photosAPI = require('../interfaces/photoJSON.js');
const logger = require('winston');

logger.level = 'debug';


photosAPI.init()
    .then(() => {
        // Once a day, copy files to onedrive
        cron.schedule('* 23 * * *', function(){
            logger.debug("Creating new copy to onedrive job");
            photosAPI.jobs.add({
                operation: global.TASK_PROCESSORS.COPY_TO_ONEDRIVE,
                data: {
                    "folder" : "M:\\Temp Photo Landing Zone",
                    "destDir" : global.CONFIG.options.basedir,
                    "recycleBin" : "M:\\RecycleBin",
                    "safeMode" : false
                }
            });
        });

        // Run the index once every 2 hours
        //cron.schedule('* */2 * * *', function(){
        cron.schedule('20 * * * *', function(){
            logger.debug("Creating new index job");
            
            require('./index.js');
        });
    })
