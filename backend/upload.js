const ss = require('socket.io-stream');
const ffmpeg = require('fluent-ffmpeg');
const {  mkdirSync, existsSync } = require("fs");
const path = require("path");

function router(socket) {
    ss(socket).on("upload", async (stream, data) => {
        const filename = path.basename(data.name);
        console.log("uploading: " + filename);
        const outputPath = `./tmp/upload/${new Date().getTime()}`;
        if (!existsSync(outputPath)) {
            mkdirSync(outputPath, { recursive: true });
        }
        const command = ffmpeg(stream)
        .on('start', function (commandLine) {
            console.log('Starting the transcoding...');
            console.log(commandLine);
        })
        .on('stderr', (stderrLine) => {
            if (!stderrLine.includes('frame=')) {
            console.error(stderrLine);
            }
        })
        .on('error', (error) => {
            console.error('Failed to complete transcoding', error);
        })
        .on('end', async function () {
            console.log('Transcoding succeeded !');
            ss(socket).emit("upload.response", { filename, outputPath });
        })
        .addOptions(['-hide_banner', '-y'])

        command
        .output(`${outputPath}/playlist.m3u8`)
        .format('hls')
        .complexFilter('scale=1280x720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black')
        .outputOptions([
            '-c:a aac',
            '-b:a 160k',
            '-ar 48000',
            '-ac 2',
            '-c:v libx264',
            '-preset:v fast',
            '-pix_fmt yuv420p',
            '-crf 20',
            '-maxrate 2808k',
            '-bufsize 5616k',
            '-max_muxing_queue_size 4096',
            '-g 25',
            '-keyint_min 25',
            '-force_key_frames expr:gte(t,n_forced*1)',
            `-hls_segment_filename ${outputPath}/chunk_%06d.ts`,
            `-hls_time 2`,
            '-hls_list_size 0',
            '-master_pl_name master.m3u8',
        ])
        .run();
    });
}

module.exports = router;