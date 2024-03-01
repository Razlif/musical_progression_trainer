let globalSynth = null;
let placeHolderDirection = ""
let intervalNote = ""

function displayMessage(message) {
    document.getElementById('feedbackDisplay').textContent = ""
    document.getElementById('feedbackDisplay').textContent = message;
}

function calculateIntervalNote(rootNote, interval, direction) {
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let octave = parseInt(rootNote.slice(-1), 10); // Extract the octave
    let noteWithoutOctave = rootNote.slice(0, -1); // Extract the note without the octave
    let noteIndex = noteSequence.indexOf(noteWithoutOctave); // Find the index of the note in the sequence

    // Handle "random" direction by choosing either "ascending" or "descending"
    if (direction === "random") {
        direction = Math.random() > 0.5 ? "ascending" : "descending";
    }
    if (direction === "ascending") {
        noteIndex += interval; // Move up the interval
    } else { // "descending"
        noteIndex -= interval; // Move down the interval
    }

    placeHolderDirection = direction === "ascending" ? "↑" : "↓"

    // Adjust octave and noteIndex for overflows and underflows
    while (noteIndex < 0) {
        noteIndex += 12; // Move up an octave if underflow
        octave -= 1;
    }
    while (noteIndex >= 12) {
        noteIndex -= 12; // Move down an octave if overflow
        octave += 1;
    }

    return noteSequence[noteIndex] + octave.toString();
}

function playNote(note) {
    console.log(`Playing note: ${note}`)
    globalSynth.triggerAttackRelease(note, '1m');
}

function intervalToName(interval) {
    const intervalNames = {
        1: 'Minor 2nd',
        2: 'Major 2nd',
        3: 'Minor 3rd',
        4: 'Major 3rd',
        5: 'Perfect 4th',
        6: 'Tritone',
        7: 'Perfect 5th',
        8: 'Minor 6th',
        9: 'Major 6th',
        10: 'Minor 7th',
        11: 'Major 7th',
        12: 'Perfect Octave'
    };

    return intervalNames[interval] || 'Unknown Interval';
}


async function createCustomSynth() {
    // Create a new Tone.Sampler instance with the defined notes
    const newSynth = new Tone.Sampler({
	urls: {
		"C4": "C4.mp3",
		"D#4": "Ds4.mp3",
		"F#4": "Fs4.mp3",
		"A4": "A4.mp3",
	},
	baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

    await Tone.loaded();

    globalSynth = newSynth
}

document.addEventListener('DOMContentLoaded', function() {
    createCustomSynth()
    let userSettings = {
        intervals: [1,2,3,4,5,6,7,8,9,10,11,12],
        direction: 'ascending',
        rootNote: 'C4', 
        currentInterval: null
    };

    document.getElementById('intervalSelector').addEventListener('change', function(e) {
        userSettings.intervals = Array.from(e.target.selectedOptions).map(option => parseInt(option.value, 10));
        console.log(`selected intervals: ${userSettings.intervals}`)
    });

    document.getElementById('directionSelector').addEventListener('change', function(e) {
        userSettings.direction = e.target.value;
        console.log(`direction: ${userSettings.direction}`)
        
    });

    // Repeat Root Note Button
    document.getElementById('repeatRootNoteButton').addEventListener('click', function() {
        playNote(userSettings.rootNote); // Assuming playNote is defined to play a single note
    });

    // Add event listener for the "Next" button
    document.getElementById('nextButton').addEventListener('click', function() {
        // Check the selected key
        let selectedKey = document.getElementById('keySelector').value;
        if (selectedKey === "Random") {
            // Define an array of possible keys (for simplicity, using only natural notes here)
            const keys = ["C", "D", "E", "F", "G", "A", "B"];
            // Randomly select a key
            selectedKey = keys[Math.floor(Math.random() * keys.length)] + "4"; // Append "4" for the octave
        } else {
            // Use the selected key and append "4" for the octave
            selectedKey += "4";
        }

        // Update the rootNote in userSettings with the selected or randomly chosen key
        userSettings.rootNote = selectedKey;
        
        // Select a random interval from the user's selections
        userSettings.currentInterval = userSettings.intervals[Math.floor(Math.random() * userSettings.intervals.length)];
        console.log(`interval to get: ${userSettings.currentInterval}`)
        // Play the root note to start the practice session
        playNote(userSettings.rootNote);
        intervalNote = calculateIntervalNote(userSettings.rootNote, userSettings.currentInterval, userSettings.direction)
        // Display message to prompt the user to identify the interval
        displayMessage(`${placeHolderDirection} ${intervalToName(userSettings.currentInterval)}`);
        
    });

    // Modify the "Play" button event listener to check if it's the first play
    document.getElementById('playButton').addEventListener('click', function() {
        if (userSettings.currentInterval) {
            // Play the interval note only if the current interval is set (which is done by the "Next" button)
            console.log(`interval note: ${intervalNote}`)
            playNote(intervalNote)
            // Auto Continue to Next Interval
            if (document.getElementById('autoContinue').checked) {
                setTimeout(() => {
                    document.getElementById('nextButton').click(); // Automatically trigger the next interval
                }, 2000); // 2 seconds delay
            }
        } else {
            // If no interval is set, inform the user to click "Next" first
            displayMessage("Please click 'Next' to start.");
        }
    });
    
});





