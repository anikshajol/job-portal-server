/**
 * 1st install jsonwebtoken and cookie-parser
 * import jwt and cookie-parser on backend like const jwt = require(jsonwebtoken)
 * tarpor login user ke diye token verify kora client side theke auth provider jkhane skhane currentuser theke userData={email:currentUser.email} axios.post('http://localhost:5000/jwt', userData).then(res=>{console.log(res.data)}).catch(err=>err)
 * cookies a store er jonno {withCredential: true} deya lagbe, ar normal fetch er jonno credential: 'include'
 * backend a app.post('/jwt', (req,res)=>{
 * const userData = req.body;
 * const token = jwt.sign(userData, process.env.secretKey ,{expiresIn: '1h'})
 * res.cookie('token', token, {
 * httpOnly: true,
 * secure: false,
 * samSite: 'lax',
 * maxAge: 60 *60 *1000; //1h
 * })
 * })
 *
 * secretKey ta node thke require('crypto').randomBytes(64).toString('hex')
 * cookies er jonno middleweare app.use(cors({
 * origin: ''  client sider er url;
 * credential: true;
 * }))
 *
 * tarpor middleware banano lagbe tokenVerify er jonno
 * const verifyToken = (req,res,next)=>{
 * console.log(req.cookies?.token)
 * const token = req?.cookies?.token;
 *   //check token exist or not ?
 *
 *  if(!token){
 *  return res.status(401).send({message: 'Unauthorized Access'})
 *   jwt.verify(token, process.env.secretKey, (err,decode)=>{
 *      if(err){
 *  return res.status(401).json({message: 'Unauthorized Access'})
 * }
 *
 * })
 * }
 *
 * next() // call kora lagbe poroborti kajer jonno, na hoy theme jabe
 *
 * }
 * **/
