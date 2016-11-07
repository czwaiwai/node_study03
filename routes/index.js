var crypto=require('crypto');
var express = require('express');
var router = express.Router();
var multer=require('multer');
var User=require('../models/user');
var Post=require('../models/post');
var Comment=require('../models/comment');
var uploadUrl='public/uploads';
var storage=multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadUrl);
    },
    filename: function (req, file, cb) {
        var rename=file.fieldname + '-' + Date.now()+file.originalname.slice(file.originalname.indexOf('.'));
        cb(null,rename );
    }
})
var upload=multer({
  //  dest: 'public/uploads/',
    storage:storage,
    fileFilter:function(req, file, cb) {
        console.log("fileFilter",file);
        cb(null,true);
    }
});
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录！');
        return  res.redirect('/login');
    }
    next();
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录!');
        return  res.redirect('back');//返回之前页面
    }
    next();
}

module.exports = function(app){

    app.get('/',function(req,res){
        var page=req.query.p?parseInt(req.query.p):1;
        Post.getTen("",page,function(err,posts,total){
            if(err){
                posts=[];
            }
            res.render('index',{
                title:"主页",
                user:req.session.user,
                posts:posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage:(page-1)*10+posts.length==total,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });
    app.get('/u/:name',function(req,res){//用户的路由规则
        var page=req.query.page?parseInt(req.query.p):1;
        User.get(req.params.name,function(err,user){
            if(!user){
                req.flash('error','用户不存在！');
                return res.redirect('/');
            }
            Post.getTen(user.name,page,function(err,posts,total){
                if(err){
                    posts=[];
                }
                res.render('user',{
                    title:user.name,
                    user:req.session.user,
                    posts:posts,
                    page:page,
                    isFirstPage:(page-1)==0,
                    isLastPage:(page-1)*10+posts.length==total,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                })
            });
            // Post.getAll(user.name,function(err,posts){
            //     if(err){
            //         req.flash('error',err);
            //         return res.redirect('/');
            //     }
            //     res.render('user',{
            //         title:user.name,
            //         posts:posts,
            //         user:req.session.user,
            //         success:req.flash('success').toString(),
            //         error:req.flash('error').toString()
            //     });
            // });
        });
    });
    app.get('/u/:name/:day/:title',function(req,res){
        Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title:req.params.title,
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.get('/edit/:name/:day/:title',checkLogin);
    app.get('/edit/:name/:day/:title',function(req,res){
        var currentUser=req.session.user;
        Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
           if(err){
               req.flash('error',err);
               return res.redirect('back');
           }
            res.render('edit',{
                title:'编辑',
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:name/:day/:title',function(req,res){
        var currentUser=req.session.user;
        Post.update(currentUser.name,req.params.day,req.params.title,req.body.content,function(err){
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            console.log('url',url);
            if (err) {
                req.flash('error', err);
                return res.redirect(url);//出错！返回文章页
            }
            req.flash('success','修改成功');
            res.redirect(url);//成功！返回文章页
        });
    });
    app.get('/remove/:name/:day/:title',function(req,res){
        var currentUser=req.session.user;
        Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('/');
        })
    });
   app.get('/reg',checkNotLogin);
   app.get('/reg',function(req,res){
       res.render('reg',{
           title:"注册",
           user:req.session.user,
           success:req.flash('success').toString(),
           error:req.flash('error').toString()
       });
   });
    app.post('/reg',function(req,res){
        var name=req.body.username,
            password=req.body.pwd,
            password_re=req.body['pwd-repeat'];
        if(password_re!=password){
            req.flash('error','两次输入的密码不一致！');
            return res.redirect('/reg');
        }
         var md5=crypto.createHash('md5'),
             password=md5.update(req.body.pwd).digest('hex');
        var newUser=new User({
            name:name,
            pwd:password,
            email:req.body.email
        });
        //检查用户名是否已经存在
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error','用户已存在！');
                return res.redirect('/reg');
            }
            newUser.save(function(err,user){
                if(err){
                    req.flash('err',err);
                    return res.redirect('/reg');
                }
                req.session.user=user;
                req.flash('success','注册成功！');
                res.redirect('/');
            });
        })
    });
    app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:"登录",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    app.post('/login',function(req,res){
        if(!req.body.username){
            req.flash("error","用户名不能为空！");
            return res.redirect('/login');
        }
        if(!req.body.pwd){
            req.flash("error","密码不能为空！");
            return res.redirect('/login');
        }
        User.get(req.body.username,function(err,user){
            if(err){
                req.flash("error",err);
                return res.redirect("/");
            }
            if(!user){
                req.flash("error","用户没有注册");
                return res.redirect("/login");
            }
            var md5=crypto.createHash('md5'),password=md5.update(req.body.pwd).digest('hex');
            if(user.pwd!=password){
                req.flash("error","用户密码不正确");
                return res.redirect("/login");
            }
            req.session.user=user;
            req.flash('success','登录成功！');
            res.redirect('/');
        })

    });
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
      res.render('post',{
          title:'发表',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
      });
    });

    app.post('/post',function(req,res){
        var newPost={
            name:req.session.user.name,
            title:req.body.title,
            tags:[req.body.tag1,req.body.tag2,req.body.tag3],
            content:req.body.content
        };
        var post=new Post(newPost);
        post.save(function(err,post){
            if(err){
                req.flash('error',err);
            }
            req.flash('success','发表成功');
            res.redirect('/')
        });

    });
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
         res.render('upload',{
             title:'上传',
             user:req.session.user,
             success:req.flash('success').toString(),
             error:req.flash('error').toString()
         });
    });
    app.post('/upload',upload.array('file1',3),function(req,res){
        req.flash('success',"上传成功"+req.files[0].path);
        res.redirect('/upload');
    });

    app.get('/u/:name/:day/:title',function(req,res){
        Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title:'req.params.title',
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });
    app.post("/u/:name/:day/:title",function(req,res){
        var  date=new Date(),
              time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment={
            name:req.body.name,
            email:req.body.email,
            website:req.body.website,
            time:time,
            content:req.body.content
        };
        var newComment=new Comment(req.params.name,req.params.day,req.params.title,comment);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','留言成功!');
            res.redirect('back');
        })
    });
    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user=null;
        req.flash('success',"登出成功！");
        res.redirect('/');
    });
    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title:"存档",
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
    });
    app.get('/tags',function(req,res){
        Post.getTags(function(err,tags){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tags',{
                title:'标签',
                user:req.session.user,
                tags:tags,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });
    app.get('/tags/:tag',function(req,res){
         Post.getTag(req.params.tag,function(err,posts){
             if(err){
                 req.flash("error",err);
                 return res.redirect('/');
             }
             res.render('tag',{
                 title:'TAg'+req.params.tag,
                 posts:posts,
                 user:req.session.user,
                 success:req.flash('success').toString(),
                 error:req.flash('error').toString()
             })
         });
    });
    app.get('/search',function(req,res){
        Post.search(req.query.keyword,function(err,posts){
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search',{
                title:'查询:'+req.query.keyword,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    });
};
