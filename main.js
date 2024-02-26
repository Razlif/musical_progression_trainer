let currentProgressionIndex = 0; // Tracks the user's current position in the progression
let currentProgressionSequence = []; // Holds the current progression sequence
let currentProgression = []; // This will hold the current chord progression
let globalSynth = null;


// Mapping of notes to their positions in a chromatic scale starting from C
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const userSettings = {
    key: "C4",
    progressionLength: 4,
    useDiatonic: true,
    addSevens: false,
};


document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('keySelector').value = userSettings.key.slice(0, -1); // Remove the octave for display
    const repeatButton = document.getElementById('repeatProgressionButton');
    repeatButton.addEventListener('click', function() {
        if (globalSynth) {
            globalSynth.releaseAll(); 
        }
        playProgression(currentProgression);
    });
    document.getElementById('playButton').addEventListener('click', async function() {
        if (globalSynth) {
            globalSynth.releaseAll(); 
        }
        let selectedKey = document.getElementById('keySelector').value;
        if (selectedKey === "Random") {
            // Define an array of possible keys (excluding "Random")
            const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            // Randomly select a key
            selectedKey = keys[Math.floor(Math.random() * keys.length)];
        }

        // Append "4" for middle octave
        userSettings.key = selectedKey + "4";
        userSettings.addSevens = document.getElementById('addSevens').checked;
        userSettings.progressionLength = parseInt(document.getElementById('progressionLength').value, 10);
        userSettings.openWithTonic = document.getElementById('openWithTonic').checked;
        userSettings.endWithTonic = document.getElementById('endWithTonic').checked;
        userSettings.addBass = document.getElementById('addBass').checked;
        console.log("Updated user settings:", userSettings);

        console.log("Starting audio context...");
        await Tone.start();
        console.log("Audio context started.");

        // Generate the chord progression
        const progression = generateDiatonicProgression(userSettings);
        currentProgression = progression 
        console.log("Generated progression:", progression);
        // Example of setting up currentProgressionSequence right after generating the progression
        currentProgressionSequence = progression.map(({ note, chordType }) => note + chordType);
        console.log("Progression Sequence:", currentProgressionSequence); // Debugging
        currentProgressionIndex = 0
        playProgression(progression)
        displayAvailableChords(progression)
        initializeProgressionDisplay(progression.length)
    });
});


// Function to get the interval between C and the selected key
function getIntervalFromCToKey(key) {
    return chromaticScale.indexOf(key) - chromaticScale.indexOf('C');
}

// Function to transpose a note from C to the selected key
function transposeNote(note, interval) {
    const noteIndex = chromaticScale.indexOf(note);
    const transposedNoteIndex = (noteIndex + interval + 12) % 12; // Ensure we wrap around the chromatic scale correctly
    return chromaticScale[transposedNoteIndex];
}

function generateDiatonicProgression(settings) {
    const notesInC = ["C", "D", "E", "F", "G", "A", "B"];
    const chordTypes = settings.addSevens ? ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"] : ["maj", "min", "min", "maj", "maj", "min", "dim"];

    // Calculate the interval to transpose from C to the selected key
    const keyWithoutOctave = settings.key.slice(0, -1); // Remove octave
    const interval = getIntervalFromCToKey(keyWithoutOctave);

    let progression = [];
    for (let i = 0; i < settings.progressionLength; i++) {
        const degreeIndex = Math.floor(Math.random() * notesInC.length);
        const noteInC = notesInC[degreeIndex];
        const chordType = chordTypes[degreeIndex];

        // Transpose the note from C to the selected key
        const transposedNote = transposeNote(noteInC, interval) + settings.key.slice(-1); // Append the original octave
        // Include the scale degree (1-based index) along with note and chord type
        progression.push({ note: transposedNote, chordType, degree: degreeIndex + 1 });
    }

    // Handle "Open with Tonic" and "End with Tonic" options
    if (userSettings.openWithTonic) {
        const tonicNote = transposeNote(notesInC[0], interval) + settings.key.slice(-1);
        progression.unshift({ note: tonicNote, chordType: settings.addSevens ? 'maj7' : 'maj', degree: 1 });
    }
    if (userSettings.endWithTonic) {
        const tonicNote = transposeNote(notesInC[0], interval) + settings.key.slice(-1);
        progression.push({ note: tonicNote, chordType: settings.addSevens ? 'maj7' : 'maj', degree: 1 });
    }

    return progression;
}


function getChordNotes(rootWithOctave, chordType) {
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // Expanded chord formulas to include triads and 7ths
    const chordFormulas = {
        'maj': [0, 4, 7], // Major triad
        'min': [0, 3, 7], // Minor triad
        'dim': [0, 3, 6], // Diminished triad
        'maj7': [0, 4, 7, 11], // Major 7th
        'm7': [0, 3, 7, 10], // Minor 7th
        '7': [0, 4, 7, 10], // Dominant 7th
        'm7b5': [0, 3, 6, 10], // Half-diminished (minor 7 flat 5)
    };

    const rootNote = rootWithOctave.slice(0, -1);
    const octave = parseInt(rootWithOctave.slice(-1), 10);
    const rootIndex = noteSequence.indexOf(rootNote);
    const formula = chordFormulas[chordType];

    if (rootIndex === -1 || !formula) {
        console.error("Invalid root note or chord type.");
        return [];
    }

    return formula.map(interval => {
        const noteIndex = (rootIndex + interval) % noteSequence.length;
        let noteOctave = octave + Math.floor((rootIndex + interval) / noteSequence.length);
        return `${noteSequence[noteIndex]}${noteOctave}`;
    });
}

function displayAvailableChords(progression) {
    const container = document.getElementById('availableChords');
    container.innerHTML = ''; // Clear existing chords
    
    let uniqueChords = Array.from(new Set(progression.map(chord => JSON.stringify(chord))))
                            .map(str => JSON.parse(str));

    // Shuffle the unique chords to randomize their display order
    shuffleArray(uniqueChords);


    uniqueChords.forEach(({ note, chordType, degree }) => {
        const button = document.createElement('button');
        button.classList.add('chord-button');
        button.textContent = `${degree} ${chordType}`; // Display text
    
        button.addEventListener('click', () => {
            playChord(note, chordType);
            verifyUserSelection(note, chordType, degree);
        });
        container.appendChild(button);
    });
    
}

async function playChord(rootWithOctave, chordType) {
    // Stop any existing playback
    globalSynth.releaseAll(); 
    const playbackStyle = document.querySelector('input[name="playbackStyle"]:checked').value;
    const notes = getChordNotes(rootWithOctave, chordType);

    if (playbackStyle === 'harmony') {
        // Play all notes of the chord together for harmony
        globalSynth.triggerAttackRelease(notes, '2n');
    } else if (playbackStyle === 'arpeggio') {
        // Sequentially play notes for arpeggio
        notes.forEach((note, index) => {
            globalSynth.triggerAttackRelease(note, '2n', Tone.now() + index * 0.25); 
        });
    }
}


function initializeProgressionDisplay(progressionLength) {
    const displayContainer = document.getElementById('progressionDisplay');
    displayContainer.innerHTML = ''; // Clear previous content

    for (let i = 0; i < progressionLength; i++) {
        const emptySquare = document.createElement('div');
        emptySquare.classList.add('chord-placeholder');
        emptySquare.textContent = '?'; // Placeholder text
        displayContainer.appendChild(emptySquare);
    }
}


function verifyUserSelection(selectedNote, selectedChordType, selectedDegree) {
    // Construct the chord name from the selected note and chord type
    const selectedChordName = selectedNote + selectedChordType;

    // Log the expected and selected chord names for debugging
    console.log("Selected Chord:", selectedChordName);
    console.log("Expected Chord at current position (" + currentProgressionIndex + "):", currentProgressionSequence[currentProgressionIndex]);

    // Check if the selected chord matches the next chord in the progression
    if (currentProgressionSequence[currentProgressionIndex] === selectedChordName) {
        console.log("Correct selection!");
        // Correct selection, update the display
        const progressionDisplay = document.getElementById('progressionDisplay').children;
        if (progressionDisplay[currentProgressionIndex]) {
            progressionDisplay[currentProgressionIndex].textContent = `${selectedDegree} ${selectedChordType}`;
            currentProgressionIndex++; // Move to the next chord in the progression
        }

        // Check if the game is complete
        if (currentProgressionIndex >= currentProgressionSequence.length) {
            console.log("Progression complete!");
            if (document.getElementById('autoContinue').checked) {
                console.log("Auto continue is enabled. Triggering new progression...");
                // Wait 2 seconds before continuing
                setTimeout(() => {
                    // Simulate a click on the "Play" button to generate and play a new progression
                    document.getElementById('playButton').click();
                }, 2000); 
            }
        }
    } else {
        console.log("Try again!"); 
    }
}

async function playProgression(progression) {
    if (globalSynth) {
        globalSynth.releaseAll(); 
    } else {
        await createCustomSynth()
    }
    const playbackStyle = document.querySelector('input[name="playbackStyle"]:checked').value;

    progression.forEach(({ note, chordType }, index) => {
        const notes = getChordNotes(note, chordType);
        // If "Add Bass" is selected, prepend the bass note
        if (userSettings.addBass) {
            const bassNote = note.slice(0, -1) + (parseInt(note.slice(-1), 10) - 1);
            notes.unshift(bassNote); // Adjust for PolySynth compatibility
        }

        // Schedule the chord to play
        if (playbackStyle === 'harmony') {
            globalSynth.triggerAttackRelease(notes, '2n', Tone.now() + index * 2);
        } else if (playbackStyle === 'arpeggio') {
            notes.forEach((note, noteIndex) => {
                globalSynth.triggerAttackRelease(note, '2n', Tone.now() + index * 2 + noteIndex * 0.25);
            });
        }
    });
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}


function createCustomSynth2() {
    // Check if there's an existing synth and stop all its notes
    if (globalSynth) {
        globalSynth.releaseAll();
    }

    // Create a new PolySynth
    globalSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: 'triangle'
        },
        envelope: {
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.4
        },
        modulation: {
            type: 'sine',
            frequency: 2,
            modulationIndex: 2
        }
    }).toDestination();
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