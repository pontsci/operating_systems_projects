#! /usr/bin/env node
const fs = require("fs");

//the time per unit of distance in ms
const DISTANCE_TIME = 0.15;

//the time it takes to start moving in ms
const START_TIME = 1;

//the time it takes to stop moving in ms
const STOP_TIME = 1;

//the latency in ms
const LATENCY = 4.2;

//the grand total of accumulated time
let totalTime = 0;

//the cylinder we are currently on, starts at 0
let lastCylinder = 0;

//the unique request ID, this is incremented for every request put into the queue
let reqID = 0;

let amountProcessed = 0;

// process user arguments
var myArgs = process.argv.slice(2);
const ALG_TYPE = myArgs[0];
const QUEUE_SIZE = myArgs[1];
const INPUT_FILE = myArgs[2];
// console.log("Alogirthm type: %s", ALG_TYPE);
// console.log("Queue Size: %d", QUEUE_SIZE);
// console.log("Input File: %s\n", INPUT_FILE);

let dataArray = [];
try {
  // read contents of the file
  const data = fs.readFileSync(INPUT_FILE, "UTF-8");

  // split the contents by new line
  const lines = data.split(/\r?\n/);

  // push all the lines
  lines.forEach((line) => {
    if (line != "") {
      dataArray.push(line);
    }
  });
} catch (err) {
  console.error(err);
}

let queue = [];
// init the queue, removing data from the dataArray
for (let i = 0; i < QUEUE_SIZE; i++) {
  //shift off the dataArray and send it to the queue.
  addRequestToQueue(dataArray.shift());
}

//the algorithm type
if (ALG_TYPE == "FIFO") {
  fifoAlg();
} else if (ALG_TYPE == "SSTF") {
  sstfAlg();
} else if (ALG_TYPE == "CSCAN") {
  cscanAlg();
}

function cscanAlg() {
  while (queue.length) {
    //if we can keep going up, do so
    logToFile(`Our current cylinder is: ${lastCylinder}`);
    if (cylinderInQueueExistsAbove(lastCylinder)) {
      //order it the relevant cylinders (the ones above the last scheduled)
      orderQueueByCylinderNumberAboveLast();

      //process the next one
      processRequest(queue[0]);
    } else {
      //set it to our lowest cylinder in the queue
      console.log("To the bottom!!!!");
      queue.sort((a, b) => {
        return a.getCylinderNumber() - b.getCylinderNumber();
      });
      processRequest(queue[0]);
    }
  }
  printData();
}

function sstfAlg() {
  while (queue.length) {
    updateShortestPathsInQueue();
    orderQueueByShortestPath();
    processRequest(queue[0]);
    //console.log("The queue length: " + queue.length);
  }
  printData();
}

function fifoAlg() {
  while (queue.length) {
    processRequest(queue[0]);
    //console.log("The queue length: " + queue.length);
  }

  printData();
}

//true if in the queue, a cylinder exists above this one
function cylinderInQueueExistsAbove(cylNumber) {
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].getCylinderNumber() >= cylNumber) {
      return true;
    }
  }
  return false;
}

function orderQueueByShortestPath() {
  queue.sort((a, b) => {
    return a.getPathToLastCylinder() - b.getPathToLastCylinder();
  });
}

function orderQueueByCylinderNumberAboveLast() {
  console.log("Shuffling queue!!");
  let cylindersAbove = [];
  let cylindersBelow = [];
  queue.forEach((r) => {
    //console.log("Our Cylinder Number: " + r.getCylinderNumber());
    if (r.getCylinderNumber() >= lastCylinder) {
      //console.log(r.getCylinderNumber() + " GOES TO ABOVE!!!");
      cylindersAbove.push(r);
    } else {
      //console.log(r.getCylinderNumber() + " GOES TO BELOW!!!");
      cylindersBelow.push(r);
    }
  });
  //empty the queue to be refactored
  queue = [];

  //sort the two arrays
  cylindersAbove.sort((a, b) => a.getCylinderNumber() - b.getCylinderNumber());

  //for each of the above, add it to the queue
  cylindersAbove.forEach((r) => {
    queue.push(r);
  });
  cylindersBelow.forEach((r) => {
    queue.push(r);
  });
  // console.log("THE QUEUE:");
  // printArraySmall(queue);
}

function updateShortestPathsInQueue() {
  queue.forEach((r) => {
    r.setPathToLastCylinder(Math.abs(lastCylinder - r.getCylinderNumber()));
  });
}

function printData() {
  console.log("The current time total: %f", totalTime);
  console.log("The amount of requests processed: %d\n", amountProcessed);
  console.log("The average time taken: %f", totalTime / amountProcessed);
}

function printRequestData(req) {
  console.log("PROCESSING REQUEST ID: %d", req.getRequestID());
  console.log("Cylinder Number: %d", req.getCylinderNumber());
  console.log("Time Waiting: %f\n\n", req.getTimeWaiting());
}

function printArray(array) {
  array.forEach((r) => {
    printRequestData(r);
  });
}

function printArraySmall(array) {
  array.forEach((r) => {
    console.log(r.getCylinderNumber() + ", ");
  });
}

//adds a request to the queue with a given request id
function addRequestToQueue(cylinderNumber) {
  queue.push(generateRequest(cylinderNumber, reqID++));
}

function processRequest(req) {
  amountProcessed++;
  //we have no movement time so just add latency
  if (lastCylinder == req.getCylinderNumber()) {
    queue.forEach((r) => {
      r.addToTime(LATENCY);
    });
  } else {
    //we have some movement time in addition to latency
    queue.forEach((r) => {
      r.addToTime(LATENCY);
      r.addToTime(
        START_TIME +
          STOP_TIME +
          Math.abs(lastCylinder - req.getCylinderNumber()) * DISTANCE_TIME
      );
    });
  }
  //add its time to the total time
  totalTime += req.getTimeWaiting();

  //find the index of our given request ID
  let requestToRemove = queue.findIndex(
    (r) => r.getRequestID() == req.getRequestID()
  );

  //remove it from the queue
  queue.splice(requestToRemove, 1);

  //add our next request to the queue, if one exists
  if (dataArray.length) {
    addRequestToQueue(dataArray.shift());
  }

  //change our last cylinder scheduled
  lastCylinder = req.getCylinderNumber();

  printRequestData(req);
}

// the request object, it holds the cylinder number and the time that it has been waiting.
function generateRequest(cylinderNumber, requestID) {
  const _cylinderNumber = parseInt(cylinderNumber);
  let _timeWaiting = 0;
  //the request id, to differentiate same cylinder numbers within the queue.
  const _requestID = requestID;
  let _pathToLastCylinder = parseInt(cylinderNumber);

  return {
    getTimeWaiting() {
      return _timeWaiting;
    },
    getCylinderNumber() {
      return _cylinderNumber;
    },
    getRequestID() {
      return _requestID;
    },
    getPathToLastCylinder() {
      return _pathToLastCylinder;
    },
    setPathToLastCylinder(path) {
      _pathToLastCylinder = path;
    },
    addToTime(timePassed) {
      _timeWaiting += timePassed;
    },
  };
}

function logToFile(message) {
  let stream = fs.createWriteStream("log.txt", { flags: "a" });
  stream.write(`${message}\n`);
  stream.close;
}
