var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Photo Manager Rask Runner',
  description: 'Task runner for the Photo Manager',
  script: 'M:\\OneDrive\\projects\\Codes\\Scripts\\NodeScripts\\photoManager\\taskRunner.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();
