var fs = require('fs');
var program = require('commander');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var utils = require("./utils.js");

// Configuration
var threshold = 8;
var apName = "wlxf81a671a3127";
var minimumTimePeriodBetweenPassingVehicles = 200;

program
    .version('0.0.1')
    .option('-k, --calibrate', 'Run when there are no vehicles. It will take a few seconds to proceed.')
    .option('-c, --count', 'Count vehicles')
    .option('-d, --countAndDebug', 'Count vehicles and save measurements to a file')
    //.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
    .parse(process.argv);

if (program.calibrate) utils.calibrate(apName);
if (program.count) count();

function count() {
    console.log("Press <q> to quit.");
    console.log("Press <c> if you detected a car.");
    console.log("Press <d> if you detected a fast car.");
    console.log("Press <t> if you detected a truck.");
    console.log("Press <5> if you detected a fast truck.");
    console.log("Press <b> if you detected a bus.");
    console.log("Press <g> if you detected a fast bus.");
    console.log("Press <r> if you detected a bicycle.");
    console.log("Press <4> if you detected a fast bicycle.");
    console.log("Press <m> if you detected a motorcycle.");
    console.log("Press <j> if you detected a fast motorcycle.");
    console.log("Fast means more than 40 kph. \n");
    var carCounter = 0;

    var userDetectionResults = {
        "car": 0,
        "fast car": 0,
        "truck": 0,
        "fast truck": 0,
        "bus": 0,
        "fast bus": 0,
        "bicycle": 0,
        "fast bicycle": 0,
        "motorcycle": 0,
        "fast motorcycle": 0,
        "match": 0
    };

    var occupancy = 0; // total time

    var isVehiclePassing = false;
    
    var signalStrengthWithoutNoise = parseFloat(fs.readFileSync("calibrationResult").toString());
    var whenProgramStarted = new Date();
    var filePathAndName = "results/" + utils.printDateAndTime(whenProgramStarted).replace(/:/g, "_");
    var filePathAndNameDebug = filePathAndName + " DEBUG";
    console.log("Program started at: ", utils.printDateAndTime(whenProgramStarted));
    console.log("Threshold for a car is set to ", threshold);
    console.log("Average no vehicle signal strength is: ", signalStrengthWithoutNoise, "\n");
    fs.writeFile(filePathAndName,
        "Counting started at " + whenProgramStarted + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm"
        + "\nThreshold value is " + threshold + " dBm", function(err) {
        if(err) {
            return console.log(err);
        }
        });


    fs.writeFile(filePathAndNameDebug,
        "Counting started at " + utils.printDateAndTime(whenProgramStarted) + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm"
        + "\nThreshold value is " + threshold + " dBm", function(err) {
            if(err) {
                return console.log(err);
            }
        });

    function logThatUserDetected(vehicle) {
        console.log("You detected a " + vehicle + "!");
        var tNow = new Date();
        fs.appendFileSync(filePathAndName, "\n" + utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!");
        fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!");

        if(isVehiclePassing) {
            console.log("Match!");
            userDetectionResults["match"]++;
        }
    }

    process.stdin.on('keypress', (str, key) => {
        switch(key.sequence) {
            case "q":
                handleQuitingProgram();
            case "c":
                userDetectionResults["car"]++;
                logThatUserDetected("car");
                break;
            case "d":
                userDetectionResults["fast car"]++;
                logThatUserDetected("fast car");
                break;
            case "t":
                userDetectionResults["truck"]++;
                logThatUserDetected("truck");
                break;
            case "5":
                userDetectionResults["fast truck"]++;
                logThatUserDetected("fast truck");
                break;
            case "b":
                userDetectionResults["bus"]++;
                logThatUserDetected("bus");
                break;
            case "g":
                userDetectionResults["fast bus"]++;
                logThatUserDetected("fast bus");
                break;
            case "r":
                userDetectionResults["bicycle"]++;
                logThatUserDetected("bicycle");
                break;
            case "4":
                userDetectionResults["fast bicycle"]++;
                logThatUserDetected("fast bicycle");
                break;
            case "m":
                userDetectionResults["motorcycle"]++;
                logThatUserDetected("motorcycle");
                break;
            case "j":
                userDetectionResults["fast motorcycle"]++;
                logThatUserDetected("fast motorcycle");
                break;
        }
    });

    function handleQuitingProgram() {
        var whenProgramFinished = new Date();
        var totalProgramTime = whenProgramFinished - whenProgramStarted;
        var occupancyRatio = occupancy / totalProgramTime;
        console.log("\nProgram finished at " + utils.printDateAndTime(whenProgramFinished) +
            "\nTotal program time is " + totalProgramTime + " ms.\n\n" +
            "Program detected: " + "\nvehicle: " + carCounter + "\noccupancy: " + occupancy + " ms" +
            "\noccupancy ratio: " + occupancyRatio + "\n\n"
            + "User detected: " + "\n" + utils.printUserDetectionResults(userDetectionResults));
        fs.appendFileSync(filePathAndName, "\n\nProgram finished at " + utils.printDateAndTime(whenProgramFinished) +
            "\nTotal program time is " + totalProgramTime + " ms.\n\n" +
            "Program detected: " + "\nvehicle: " + carCounter + "\noccupancy: " + occupancy + " ms" +
            "\noccupancy ratio: " + occupancyRatio + "\n\n"
            + "User detected: " + "\n" + utils.printUserDetectionResults(userDetectionResults));
        fs.appendFileSync(filePathAndNameDebug, "\n\nProgram finished at " + utils.printDateAndTime(whenProgramFinished) +
            "\nTotal program time is " + totalProgramTime + " ms.\n\n" +
            "Program detected: " + "\nvehicle: " + carCounter + "\noccupancy: " + occupancy + " ms" +
            "\noccupancy ratio: " + occupancyRatio + "\n\n"
            + "User detected: " + "\n" + utils.printUserDetectionResults(userDetectionResults));
        process.exit();
    }

    function checkisVehiclePassing(currentSignalStrength, tNow) {
        return currentSignalStrength <= signalStrengthWithoutNoise - threshold &&
            tNow - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles;
    }

    // Below value is initialized with time when program started to allow count a first vehicle.
    var momentWhenVehiclePassed = whenProgramStarted;
    var momentWhenVehicleAppeared;
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = utils.getCurrentSignalStrength(apName);

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

        if(checkisVehiclePassing(currentSignalStrength, tNow)) {
            if(!isVehiclePassing) {
                momentWhenVehicleAppeared = tNow;
                console.log(utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!");
            }
            isVehiclePassing = true;
        }
        if (currentSignalStrength > signalStrengthWithoutNoise - threshold && isVehiclePassing === true) {
            carCounter++;
            momentWhenVehiclePassed = new Date();
            var timeOfPassing = momentWhenVehiclePassed - momentWhenVehicleAppeared;
            fs.appendFileSync(filePathAndName, "\n" + utils.printDateAndTime(tNow) + " Vehicle detected!" +
                " Time of passing: " + timeOfPassing + " ms.");
            fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " Vehicle detected!" +
                " Time of passing: " + timeOfPassing + " ms.");

            console.log("Vehicle detected! Time of passing: ", timeOfPassing, " ms.");
            isVehiclePassing = false;
            console.log("carCounter: ", carCounter);
            occupancy += timeOfPassing;
        }

        fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " " + currentSignalStrength);
    }, 10);
}
