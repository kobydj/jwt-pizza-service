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
    ( async ()=> {
      this.sendMetricsPeriodically(10000);
    })();
    const timer = setInterval(async () => {
      await this.calcAuthAttempts();
      await this.sendHTTPRequests();
    },60000)
    timer.unref();
  }

  async sendHTTPRequests(){
    console.log("sending http requests")
    const postMetric = `request,bar_label=POST,source=${config.metrics.source} total=${this.postRequests}`;
    const deleteMetric = `request,bar_label=DELETE,source=${config.metrics.source} total=${this.deleteRequests}`;
    const getMetric = `request,bar_label=GET,source=${config.metrics.source} total=${this.getRequests}`;
    const putMetric = `request,bar_label=PUT,source=${config.metrics.source} total=${this.putRequests}`;
    const totalMetric = `request,bar_label=ALL,source=${config.metrics.source} total=${this.totalRequests}`;
    await this.sendMetricToGrafana(postMetric);
    await this.sendMetricToGrafana(deleteMetric);
    await this.sendMetricToGrafana(getMetric);
    await this.sendMetricToGrafana(putMetric);
    await this.sendMetricToGrafana(totalMetric);
  }

  async calcAuthAttempts(){
    console.log("calculating attempts")

    let metric = `AuthAttempts,bar_label=success,source=${config.metrics.source} rate=${this.authAttemptsSuccess}`
    await this.sendMetricToGrafana(metric);
    metric = `AuthAttempts,bar_label=failure,source=${config.metrics.source} rate=${this.authAttemptsFailure}`
    await this.sendMetricToGrafana(metric);
    metric = `ActiveUsers,source=${config.metrics.source} users=${this.activeUsers}`
    await this.sendMetricToGrafana(metric);
  }
  
  async requestTracker(req, res, next) {
    const start = Date.now(); 
    this.totalRequests++;
    console.log("in requestTracker" + req.method)
    const method = req.method
    console.log(method)
    if (method ==="POST"){
      this.postRequests++
    }else if (method ==="GET"){
      this.getRequests++
      console.log(this.getRequests)
    }else if (method ==="PUT"){
      this.putRequests++
    }else if (method ==="DELETE"){
      this.deleteRequests++
    }
    res.on('finish', () => {
      this.requestLatency = ((Date.now() - start) + this.requestLatency) / 2; // add latency to request latency and divide by to to find average.
      // console.log(`Request to ${req.url} avg latency = ${this.requestLatency}`);
    });
  //   console.log(`Total requests: ${this.totalRequests}`);
  // console.log(`POST requests: ${this.postRequests}`);
  // console.log(`GET requests: ${this.getRequests}`);
  // console.log(`PUT requests: ${this.putRequests}`);
  // console.log(`DELETE requests: ${this.deleteRequests}`);
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

  async sendMetricsPeriodically(period) {
     setInterval(async () => {
      const cpuUsage = getCpuUsagePercentage();
      const memoryUsage = getMemoryUsagePercentage();
      //  system metrics
      console.log(memoryUsage)
      await this.sendMetricToGrafana(`system,bar_label=cpu_usage,source=${config.metrics.source} cpuUsage=${cpuUsage}`);
      await this.sendMetricToGrafana(`system,bar_label=memory_usage,source=${config.metrics.source} memoryUsage=${memoryUsage}`);
      // purchase metrics
      await this.sendMetricToGrafana(`purchase,source=${config.metrics.source} PizzaPurchases=${this.pizzasSold}`);
      await this.sendMetricToGrafana(`purchase,source=${config.metrics.source} purchaseFailures=${this.creationFailures}`);
      await this.sendMetricToGrafana(`purchase,source=${config.metrics.source} revenue=${this.revenue}`);
      // latency metrics
      await this.sendMetricToGrafana(`latency,source=${config.metrics.source} serviceLatency=${this.requestLatency}`);
      await this.sendMetricToGrafana(`latency,source=${config.metrics.source} factoryLatency=${this.pizzaLatency}`);
    }, period).unref();
  }

  async sendMetricToGrafana(metric) {
    // console.log("in sendmetrics " + metric)
    try{
    const response = await fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
        if (!response.ok) {
          console.log(await response.text())
          console.error('Failed to push metrics data to Grafana');
        } else {
          // console.log(`Pushed ${metric}`);
        }
      }catch(error) {
        console.error('Error pushing metrics:', error);
      };
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

module.exports = new Metrics();;



