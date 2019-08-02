var formidable = require('formidable'),
  fs = require('fs'),
  srt2vtt = require('srt-to-vtt')

var handle = {
  '/': index,
  '/upload': upload,
  '/subtitle': sub,
  '/tst': tst
}

function RequestHandler(path, req, res, param) {
  console.log(path)

  if (typeof handle[path] === 'function') {
    handle[path](res, req, param)
  }
  else {
    var JsonRes = JSON.stringify({
      ok: false,
      error: 404,
      details: "page not found"
    });
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.write(JsonRes)
    res.end()
  }

}

function index(res) {
  tst(res)
  return
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<form action="upload" enctype="multipart/form-data" method="post">');
  res.write('<input type="file" name="filetoupload" multiple="multiple"><br>');
  res.write('<input type="submit">');
  res.write('</form>');
  res.end();
}

function sub(res, req, param) {
  fs.readFile('./uploads/' + param.get, { encoding: 'utf-8' }, (err, data) => {
    if (err) {
      console.log(err)
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify({
        ok: false,
        code: 404,
        details: 'File not found'
      }))
      res.end()
      return
    }
    res.write(data)
    res.end()
  });
}

function upload(res, req) {
  try {
    if (req.method.toLowerCase() == 'post') {
      var form = new formidable.IncomingForm()
      form.maxFieldsSize = .5 * 1024 * 1024;
      form.hash = 'md5'
      form.uploadDir = "./tmp";

      form.parse(req, (err, fields, files) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify({
            ok: false,
            error: 400,
            details: err
          }))
          res.end()
        }

        var mimeType = files.filetoupload.type,
          cheacksum = files.filetoupload.hash,
          oldpath = files.filetoupload.path,
          newpath = './uploads/' + cheacksum

        if (mimeType != 'application/x-subrip') {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify({
            ok: false,
            code: 400,
            details: 'Wrong file'
          }))
          res.end()
          fs.unlink(oldpath, (err) => {
            if (err) throw err;
          });
          return
        }

        fs.createReadStream(oldpath)
          .pipe(srt2vtt())
          .pipe(fs.createWriteStream(newpath))

        fs.unlink(oldpath, (err) => {
          if (err) throw err
        });

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.write(JSON.stringify({
          ok: true,
          code: 200,
          details: 'upload success',
          subtitles: {
            0: cheacksum
          }
        }))
        res.end()
        return
      })
    }
    else {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify({
        ok: false,
        error: 400,
        details: 'Bad Requset'
      }))
      res.end()
    }
  }
  catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({
      ok: false,
      error: 500,
      details: 'Internal server error'
    }))
    res.end()
  }
}

function tst(res) {
  fs.readFile('./templates/index.html', function (error, content) {
    if (error) {
      res.writeHead(500);
      res.end('Error');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content, 'utf-8');
    }
  });
}


exports.RequestHandler = RequestHandler
