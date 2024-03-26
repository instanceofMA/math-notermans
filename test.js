import readline from 'node:readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const URL = "https://math-notermans-production.up.railway.app";
const postJson = { method: "POST", headers: { "Content-Type": "application/json" } };

try {
    // Checking if the API is live.
    await fetch(URL).then(r => r.text())
    .then(logAndReturn);

    // Creating a new thread.
    const { threadId } = await fetch(`${URL}/ai/create`, { ...postJson }).then(res => res.json())
    .then(logAndReturn);

    // Uploading a file.
    await fetch(`${URL}/ai/upload`, { ...postJson, body: JSON.stringify({ threadId, filename: "file.docx" }) }).then(res => res.json())
    .then(logAndReturn);

    // Sending messages in the thread.
    sendMessage(threadId);
    
} catch (error) {
    console.log("Some error occurred: ", error);
}

function sendMessage(threadId) {
    rl.question(`You > `, function (message) {
        if(message === "exit") return rl.close();
        return fetch(`${URL}/ai/send`, { ...postJson, body: JSON.stringify({ threadId, message }) }).then(res => res.json())
        .then(({ ai }) => {
            console.log(`AI > ${ai}!`);
            sendMessage(threadId);
        });
    });
}

function logAndReturn(input) {
    console.log(input);
    return input;
}