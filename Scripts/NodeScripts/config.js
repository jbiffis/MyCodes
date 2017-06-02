var config = {}

config.mail = {
    server :    '',
    port :      0,
    username :  '',
    password :  ''
}

config.server = {
    database: 'mongodb://localhost:27017/photoManager'
}



config.options = {
    basedir: 'E:\\TestDest'
    //basedir: 'M:\\OneDrive\\Pictures'
}

module.exports = config;