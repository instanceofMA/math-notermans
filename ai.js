import { Router } from "express";
import { readAnyFile } from "./lib/readAnyFile.js";
import { createReadStream } from "fs";
import OpenAI from "openai";

var file;
var openai;

export async function init(apiKey) {

    openai = new OpenAI({ apiKey });
    
    const assistant = await openai.beta.assistants.create({
        name: "Law Tutor",
        instructions: await readAnyFile("instructions.txt"),
        model: "gpt-3.5-turbo",
        tools: [ { type: "retrieval" } ]
    });

    return assistant.id;
}

export const aiRouter = Router();

aiRouter.post("/create", async function(req, res, next) {
    try {
        const thread = await openai.beta.threads.create();
        return res.json({ success: true, threadId: thread.id });
    } catch(error) {
        console.log(error);
        res.json({ success: false });
    }
});

aiRouter.post("/upload", async function(req, res, next) {
    try {
        const { threadId, filename } = req.body;
        file = await openai.files.create({
            file: createReadStream(`uploads/${filename}`),
            purpose: "assistants"
        });
        req.app.files[threadId] = file;
        return res.json({ success: true });
    } catch(error) {
        console.log(error);
        res.json({ success: false });
    }
});

aiRouter.post("/send", async function(req, res, next) {
    try {
        console.log(req.body, req.app.files);
        const { threadId, message } = req.body;
        const { assistantId } = req.app;

        await openai.beta.threads.messages.create(
            threadId,
            {
                role: "user",
                content: message,
                file_ids: [req.app.files[threadId].id]
            },
            
        );

        let run = await openai.beta.threads.runs.create(
            threadId,
            { 
                assistant_id: assistantId,
                instructions: await readAnyFile("instructions.txt")
            }
        );

        while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            run = await openai.beta.threads.runs.retrieve(
                run.thread_id,
                run.id
            );
        }

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(
                run.thread_id
            );
            for (const message of messages.data.reverse()) {
                console.log(`${message.role} > ${message.content[0].text.value}`);
            }

            const data = messages.data.reverse();
            return res.json({ success: true,  user: data[1].content[0].text.value, ai: data[0].content[0].text.value });
        } else {
            console.log(run.status, run.failed_at, run.last_error, run.required_action);
        }
    } catch(error) {
        console.log(error);
        res.json({ success: false });
    }
});