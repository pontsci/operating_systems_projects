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

  toString() {
    return `Program Number:${this.programNumber}, Max Queue Size: ${
      this.MAX_QUEUE_SIZE
    }, Hits: ${this.hits}, Misses: ${this.misses}, Total Requests: ${
      this.totalRequests
    }, Percent Misses: ${
      this.percentMisses
    } The queue: ${this.queue.toString()}`;
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
}

//get the program arguments
let myArgs = process.argv.slice(2);
const INPUT_FILE = myArgs[0];
const P1_MAX_QUEUE_SIZE = myArgs[1];
const P2_MAX_QUEUE_SIZE = myArgs[2];
const P3_MAX_QUEUE_SIZE = myArgs[3];
const P4_MAX_QUEUE_SIZE = myArgs[4];

//the array that will hold all page requests from the data file
let pageRequests = [];

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

//log the stats
logToFile(p1Stats.toString());
logToFile(p2Stats.toString());
logToFile(p3Stats.toString());
logToFile(p4Stats.toString());

//generates a new page request for the programNumber specified
function generatePageRequest(programNumber, pageNumber) {
  return new PageRequest(programNumber, pageNumber);
}

//log a string to file named log.txt
function logToFile(message) {
  let stream = fs.createWriteStream("log.txt", { flags: "a" });
  writeTime = new Date();
  stream.write(`${writeTime.toString()} ||| ${message}\n`);
  stream.close;
}
