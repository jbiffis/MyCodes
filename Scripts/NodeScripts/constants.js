const config = require('C:\\node\\config.js');

global.STATUS_CODES = {
    ERROR: -1,
    
    SUCCESS: 0,

    READY: 1,
    PROCESSING: 2,
    COMPLETED: 3
}

global.CONFIG = config;

global.MODULES = {
    HOCKEY_VIDEOS: "Express Game Videos",
    PHOTO_COPY: "Photo Copy to OneDrive",
    PHOTO_INDEXER: "Photo Indexer"
}

global.FILE_TYPES = {
    IMAGE: "Image",
    VIDEO: "Video",
    UNKNOWN: "Unknown"
}

global.TABLES = {
    FILES: 'files',
    EVENTS: 'events',
    JOBS: 'jobs'
}

global.EVENTS = {
    DUPLICATE_FILE: 'Duplicate File',
    FILE_RECYCLED: 'File moved to Recycling Bin',
    FILE_RECYCLE_FAILED: 'File failed moving to Recycling Bin',
    FILE_COPIED_TO_ONEDRIVE: 'File Copied to OneDrive',
    FILE_TRANSCODED: 'File Transcoded',
    FILE_UPDATED: "File Updated",
    FILE_NEW: "New File",
    COPY_STARTED: "Copy to One Drive started",
    JOB_COMPLETE: "Job Complete",
    UNKNOWN_DATE: 'Unknown Date',
    DONE_COPY_TO_ONEDRIVE: 'Done Copy to OneDrive'
}

global.TASK_PROCESSORS = {
    COPY_TO_ONEDRIVE: 'copyFilesToOneDrive',
    HOCKEY_VIDEO_TRANSCODE: 'hockeyVideos',
    UPDATE_EXIF_DATA: 'updateExifData'
}