const config = require('./config');

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.postRequests = 0;
    this.deleteRequests = 0;
    this.getRequests = 0;
    this.putRequests = 0;
    this.activeUsers = 0;
    this.authAttemptsSuccess = 0;
    this.authAttemptsFailure = 0;
    this.pizzasSold = 0;
    this.creationFailures = 0;
    this.revenue = 0;
    this.requestLatency = 0;
    this.pizzaLatency = 0;

    // This will periodically sent metrics to Grafana
    this.sendMetricsPeriodically(10000);
    setInterval(() => {
      this.calcAuthAttempts();
      this.sendHTTPRequests();
    },60000)

  }

  sendHTTPRequests(){
    const postMetric = `request,source=${config.source},method=POST total=${this.postRequests}`;
    const deleteMetric = `request,source=${config.source},method=DELETE total=${this.deleteRequests}`;
    const getMetric = `request,source=${config.source},method=GET total=${this.getRequests}`;
    const putMetric = `request,source=${config.source},method=PUT total=${this.putRequests}`;
    const totalMetric = `request,source=${config.source},method=ALL total=${this.totalRequests}`;
    this.sendMetricToGrafana(postMetric);
    this.sendMetricToGrafana(deleteMetric);
    this.sendMetricToGrafana(getMetric);
    this.sendMetricToGrafana(putMetric);
    this.sendMetricToGrafana(totalMetric);
  }

  calcAuthAttempts(){
  let metric = `AuthAttempts,source=${config.source},success=TRUE,rate=${this.authAttemptsSuccess}`
  this.sendMetricToGrafana(metric);
  metric = `AuthAttempts,source=${config.source},success=FALSE,rate=${this.authAttemptsFailure}`
  this.sendMetricToGrafana(metric);
  this.authAttemptsFailure = 0;
  this.authAttemptsSuccess = 0;

  metric = `ActiveUsers,source=${config.source},users=${this.activeUsers}`
  this.sendMetricToGrafana(metric);
  }
  
  requestTracker(req, res, next) {
    const start = Date.now(); 
    this.totalRequests++;
    console.log("in requestTracker" + req.method)
    const method = req.method.toUpperCase()
    if (method =="POST"){
      this.postRequests++
    }else if (method =="GET"){
      this.getRequests++
    }else if (method =="PUT"){
      this.putRequests++
    }else if (method =="DELETE"){
      this.deleteRequestsRequests++
    }
    res.on('finish', () => {
      this.requestLatency = ((Date.now() - start) + this.requestLatency) / 2; // add latency to request latency and divide by to to find average.
      console.log(`Request to ${req.url} avg latency = ${this.requestLatency}`);
    });
    next();
  }

  incrementAuthAttempt(success) {
    if(success){
      this.activeUsers++
      this.authAttemptsSuccess++
    }else{
      this.authAttemptsFailure++
    }
  }
  decreaseUsers() {
    this.activeUsers--;
  }

  incrementpurchase(success, cost) {
    if(success){
      this.revenue += cost;
      this.pizzasSold++
    }else{
      this.creationFailures++
    }
  }

  updateFactoryLatency(factory){
    this.pizzaLatency = factory;
  }

  sendMetricsPeriodically(period) {
    setInterval(() => {
      const cpuUsage = getCpuUsagePercentage();
      const memoryUsage = getMemoryUsagePercentage();
      //  system metrics
      this.sendMetricToGrafana(`system,source=${config.source},cpuUsage=${cpuUsage}`);
      this.sendMetricToGrafana(`system,source=${config.source},memoryUsage=${memoryUsage}`);
      // purchase metrics
      this.sendMetricToGrafana(`purchase,source=${config.source},PizzaPurchases=${this.pizzasSold}`);
      this.sendMetricToGrafana(`purchase,source=${config.source},purchaseFailures=${this.creationFailures}`);
      this.sendMetricToGrafana(`purchase,source=${config.source},revenue=${this.revenue}`);
      // latency metrics
      this.sendMetricToGrafana(`latency,source=${config.source},serviceLatency=${this.requestLatency}`);
      this.sendMetricToGrafana(`latency,source=${config.source},factoryLatency=${this.pizzaLatency}`);
    }, period);
  }

  sendMetricToGrafana(metric) {
    fetch(`${config.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

}
const os = require('os');

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

const metrics = new Metrics();
module.exports = metrics;



