const env = key => {
    let val = process.env[key];
    if (!val) {
        throw new Error(`${key} unconfigured`);
    }
    return val;
};
const hook = env("SLACK_WEBHOOK_URL"), channel = env("SLACK_CHANNEL"), username = env("SLACK_USER"), icon_emoji = env("SLACK_ICON");

const axios = require("axios");
const postMsg = text => axios.post(hook, { channel, username, icon_emoji, text });

exports.handler = async (event) => {
    let errs;
    try {
        errs = event.Records.map(r => r.dynamodb.NewImage).filter(i => !["started", "success"].includes(i.sub_action.S)).map(ev => {
            //TODO group calls if we get multiple events often
            return postMsg(`*${new Date(parseInt(ev.recordTime.N)).toTimeString().substring(0, 8)}* ${ev.action.S} failed for *${ev.user_id.S}*
\`\`\`
${JSON.stringify(JSON.parse(ev.meta_data.S), null, 2)}
\`\`\``);
        });
        await Promise.all(errs);
    } catch (e) {
        await postMsg(`*FAULT* ${e.message}
\`\`\`
${e.stack}
\`\`\``);
    }
    return (errs || []).length;
};