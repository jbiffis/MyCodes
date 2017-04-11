
global.STATUS_CODES = {
    ERROR: -1,
    
    SUCCESS: 0,

    READY: 1,
    PROCESSING: 2,
    COMPLETED: 3

}

global.MODULES = {
    HOCKEY_VIDEOS: "Express Game Videos",
    PHOTO_COPY: "Photo Copy to OneDrive"
}

global.TABLES = {
    FILES: 'files'
}

global.EVENTS = {
    DUPLICATE_FILE: 'Duplicate File',
    FILE_RECYCLED: 'File moved to Recycling Bin',
    FILE_RECYCLE_FAILED: 'File failed moving to Recycling Bin',
    FILE_COPIED_TO_ONEDRIVE: 'File Copied to OneDrive',
    FILE_TRANSCODED: 'File Transcoded',
    UNKNOWN_DATE: 'Unknown Date',
    DONE_COPY_TO_ONEDRIVE: 'Done Copy to OneDrive'
}