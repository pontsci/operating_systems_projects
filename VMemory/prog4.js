#! /usr/bin/env node
const fs = require("fs");

//just an object to facilitate easier stat tracking
class ProgramStats {
  #programNumber; //the program number
  #queue; //the queue associated with it
  #MAX_QUEUE_SIZE; //the max queue size
  #hits = 0; //the hits
  #misses = 0; //the misses
  constructor(programNumber, queue, maxQueueSize) {
    this.#programNumber = programNumber;
    this.#queue = queue;
    this.#MAX_QUEUE_SIZE = maxQueueSize;
  }

  hit() {
    this.#hits++;
  }

  miss() {
    this.#misses++;
  }

  get programNumber() {
    return this.#programNumber;
  }

  get queue() {
    return this.#queue;
  }

  get MAX_QUEUE_SIZE() {
    return this.#MAX_QUEUE_SIZE;
  }

  get hits() {
    return this.#hits;
  }

  get misses() {
    return this.#misses;
  }

  get totalRequests() {
    return this.hits + this.misses;
  }

  get percentMisses() {
    if (this.totalRequests == 0) {
      return 0;
    } else {
      return this.misses / this.totalRequests;
    }
  }

  get percentHits() {
    if (this.totalRequests == 0) {
      return 0;
    } else {
      return ((this.hits / this.totalRequests) * 100).toFixed(2);
    }
  }

  toString() {
    return `Program Number:${this.programNumber}, Max Queue Size: ${
      this.MAX_QUEUE_SIZE
    }, Hits: ${this.hits}, Misses: ${this.misses}, Total Requests: ${
      this.totalRequests
    }, Percent Hits: ${this.percentHits} The queue: ${this.queue.toString()}`;
  }
}

//a page request object
class PageRequest {
  #programNumber; //the programNumber this request is for
  #pageNumber; //the pageNumber requested
  constructor(programNumber, pageNumber) {
    this.#programNumber = programNumber;
    this.#pageNumber = pageNumber;
  }

  get programNumber() {
    return this.#programNumber;
  }

  get pageNumber() {
    return this.#pageNumber;
  }

  toString() {
    return `Program Number: ${this.programNumber}, Page Number: ${this.pageNumber}`;
  }
}

//get the program arguments
let myArgs = process.argv.slice(2);
const INPUT_FILE = myArgs[0];
const P1_MAX_QUEUE_SIZE = myArgs[1];
const P2_MAX_QUEUE_SIZE = myArgs[2];
const P3_MAX_QUEUE_SIZE = myArgs[3];
const P4_MAX_QUEUE_SIZE = myArgs[4];
console.log(myArgs);

//the array that will hold all page requests from the data file
let pageRequests = [];
try {
  // read contents of the file
  const data = fs.readFileSync(INPUT_FILE, "UTF-8");

  // split the contents by new line
  const lines = data.split(/\r?\n/);

  // push all the lines as page requests
  lines.forEach((line) => {
    if (line != "") {
      //get the program number and page number from the line
      let [programNumber, pageNumber] = line.split(/\s/);

      //make the request object
      let pRequest = generatePageRequest(
        parseInt(programNumber),
        parseInt(pageNumber)
      );

      //push it onto the array
      pageRequests.push(pRequest);
    }
  });
} catch (err) {
  console.error(err);
}

//the program queues
let p1Queue = [];
let p2Queue = [];
let p3Queue = [];
let p4Queue = [];

//the stat trackers for ease of logging
let p1Stats = new ProgramStats(1, p1Queue, P1_MAX_QUEUE_SIZE);
let p2Stats = new ProgramStats(2, p2Queue, P2_MAX_QUEUE_SIZE);
let p3Stats = new ProgramStats(3, p3Queue, P3_MAX_QUEUE_SIZE);
let p4Stats = new ProgramStats(4, p4Queue, P4_MAX_QUEUE_SIZE);

//go until out of requests
while (pageRequests.length) {
  //shift off the next request
  let nextRequest = pageRequests.shift();
  let programNumber = nextRequest.programNumber;
  let pageNumber = nextRequest.pageNumber;

  //attempt to add the page number to the proper queue
  addPageNumberToQueue(programNumber, pageNumber);
}

//finalize the stats in aeasy to read format
printStats();
logStats(myArgs);

//adds a page number to the corresponding programNumber queue
//adds hits and misses to relevant stat objects
function addPageNumberToQueue(programNumber, pageNumber) {
  let queue; //the queue of the current program
  let maxQueueSize; //the max queue size of the current program
  let programStats; //the stats of the current program

  //determine which program queue and stats object we are working with
  setCurrentlyRunningProgram();
  maxQueueSize = programStats.MAX_QUEUE_SIZE;

  //modify queue depending if hit or miss, as well as tallying the hit or miss
  processHitOrMiss();

  function setCurrentlyRunningProgram() {
    //set which queue and stat object we are working with
    switch (programNumber) {
      case 1:
        //console.log("Program 1");
        queue = p1Queue;
        programStats = p1Stats;
        break;
      case 2:
        queue = p2Queue;
        programStats = p2Stats;
        //console.log("Program 2");
        break;
      case 3:
        queue = p3Queue;
        programStats = p3Stats;
        //console.log("Program 3");
        break;
      case 4:
        queue = p4Queue;
        programStats = p4Stats;
        //console.log("Program 4");
        break;
      default:
        console.log("invalid program number!!!");
    }
  }

  function processHitOrMiss() {
    //hit!
    if (pageIsInQueue(pageNumber, queue)) {
      programStats.hit();

      //hit, move the pageNumber to the end of the array (most recently used)
      //in this case I can just remove the element completely from the queue, and re-add it again
      //this keeps the array in the correct order with minimal thought
      let index = queue.indexOf(pageNumber);

      //console.log(`Removing ${pageNumber} with an index of ${index}`);
      queue.splice(index, 1);

      //add it to the end, it is the most recently used
      queue.push(pageNumber);
    }

    //miss!
    else {
      programStats.miss();

      //since it missed, we may have to get rid of the LRU page
      if (queue.length >= maxQueueSize) {
        //remove the least recently used
        removeLRU(queue);
      }
      //add the pageNumber
      queue.push(pageNumber);
    }
  }
}

//checks whether a page is in a given queue
function pageIsInQueue(pageNumber, queue) {
  if (queue.includes(pageNumber)) {
    return true;
  } else {
    return false;
  }
}

//simply shifts off the front of the queue, in this context, the LRU page
function removeLRU(queue) {
  queue.shift();
}

//generates a new page request for the programNumber specified
function generatePageRequest(programNumber, pageNumber) {
  return new PageRequest(programNumber, pageNumber);
}

//print the stats to the console neatly
function printStats() {
  console.log(
    "Capactiy".padEnd(13) +
      "P1".padEnd(9) +
      "P2".padEnd(9) +
      "P3".padEnd(9) +
      "P4".padEnd(9) +
      "PT".padEnd(9)
  );
  console.log(
    `${p1Stats.MAX_QUEUE_SIZE}`.padEnd(13) +
      `${p1Stats.percentHits}%`.padEnd(9) +
      `${p2Stats.percentHits}%`.padEnd(9) +
      `${p3Stats.percentHits}%`.padEnd(9) +
      `${p4Stats.percentHits}%`.padEnd(9) +
      `${averageHitPercentage()}%`.padEnd(9)
  );
}

//write the stats to a log neatly
function logStats(myArgs) {
  logToFile(myArgs);
  logToFile(
    "Capactiy".padEnd(13) +
      "P1".padEnd(9) +
      "P2".padEnd(9) +
      "P3".padEnd(9) +
      "P4".padEnd(9) +
      "PT".padEnd(9)
  );
  logToFile(
    `${p1Stats.MAX_QUEUE_SIZE}`.padEnd(13) +
      `${p1Stats.percentHits}%`.padEnd(9) +
      `${p2Stats.percentHits}%`.padEnd(9) +
      `${p3Stats.percentHits}%`.padEnd(9) +
      `${p4Stats.percentHits}%`.padEnd(9) +
      `${averageHitPercentage()}%`.padEnd(9)
  );
  logToFile("\n\n");
}

//get all hits over all requests
function averageHitPercentage() {
  return (
    ((p1Stats.hits + p2Stats.hits + p3Stats.hits + p4Stats.hits) /
      (p1Stats.totalRequests +
        p2Stats.totalRequests +
        p3Stats.totalRequests +
        p4Stats.totalRequests)) *
    100
  ).toFixed(2);
}

//logger function
function logToFile(message) {
  fs.appendFileSync("log.txt", `${message}\n`);
}
