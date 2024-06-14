const sharp = require('sharp');
const path = require('path');

module.exports = (req, res, next) => {
    
    if(!req.file){
        return next();
    }
    try{
        const { buffer, originalname } = req.file;
                
        const name = originalname.split(' ').join('_');
        const ref = `${name}${Date.now()}.webp`;

        console.log(ref);

        let filePath = path.join(__dirname, '../images/'+ref);
        sharp(buffer)
            .resize({height:800})
            .webp({ quality: 20 })
            .toFile(filePath)
            .then(() => {
                req.file.filename = ref;
                next();
            }
            );
    }catch(error){
        res.status(500).json({error});
    }
}