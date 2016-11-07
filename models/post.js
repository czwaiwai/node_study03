/**
 * Created by Administrator on 2016/9/21 0021.
 */
var mongodb=require('./db.js');
var markdown=require('markdown').markdown;
function Post(post){
    this.name=post.name;
    this.title=post.title;
    this.tags=post.tags,
    this.content=post.content;
}
module.exports=Post;
Post.prototype.save=function(callback){
    var date=new Date();
    var time={
        date:date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    var post={
        name:this.name,
        title:this.title,
        content:this.content,
        tags:this.tags,
        time:time,
        pv:0,
        comments:[]
    };
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err,post){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                console.log(post[0]);
                callback(null,post[0]);
            });
        });
    });
};
Post.edit=function(name,day,title,callback){
    mongodb.open(function(err,db){
       if(err){
          return  callback(err);
       }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,post){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,post);
            });
        });
    });
};
Post.update=function(name,day,title,content,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time.day":day,
                "title":title
            },{$set:{content:content}},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    })
};
Post.remove=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{w:1},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        });
    });
};

Post.getOne=function(name,day,title,callback){

    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,post){
                if(err){
                  mongodb.close();
                  return  callback(err);
                }
                if(post){
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{$inc:{"pv": 1}},function(err){
                        mongodb.close();
                        if(err){
                           return callback(err);
                        }
                    });
                    post.content=markdown.toHTML(post.content);
                    if(!post.comments){ post.comments=[]; }
                    post.comments.forEach(function(comment){
                        comment.content=markdown.toHTML(comment.content);
                    });
                }
               // post.content=markdown.toHTML(post.content);
                return callback(null,post);
            })

        })
    });
};
Post.getTen=function(name,page,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query={};
            if(name){
                query.name=name;
            }
            collection.count(query,function(err,total){
                collection.find(query,{
                    skip:(page-1)*10,
                    limit:10
                }).sort({time:-1}).toArray(function(err,posts){
                    mongodb.close();
                    if(err){
                        callback(err);
                    }
                    posts.forEach(function(post){
                        post.content=markdown.toHTML(post.content);
                    });
                    callback(null,posts,total);
                })
            });
        });
    });
};
Post.getAll=function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }

        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({"name":name}).sort({time:-1}).toArray(function(err,posts){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                posts.forEach(function(post){
                    post.content=markdown.toHTML(post.content);
                });
                return callback(null,posts);
            })
        })
    })
};
Post.getArchive=function(callback){
    mongodb.open(function(err,db){
       if(err){
           callback(err);
       }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                callback(err);
            }
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({time:-1}).toArray(function(err,posts){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,posts);
            });
        })
    });
};
Post.getTags=function(callback){
    mongodb.open(function(err,db){
        if(err){
           return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
               return  callback(err);
            }
            collection.distinct("tags",function(err,tags){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,tags);
            });
        });

    });
};
Post.getTag=function(tag,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err)
            }
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,posts){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,posts);
            })
        })
    });
};
Post.search=function(keyword,callback){
    mongodb.open(function(err,db){
          if(err){
              return   callback(err);
          }
        db.collection("posts",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var pattern=new RegExp(keyword,"i");
           collection.find({
               "title":pattern
           },{
               "name":1,
                "time":1,
               "title":1,
           }).sort({time:-1}).toArray(function(err,posts){
               mongodb.close();
               if(err){
                   return callback(err);
               }
               callback(null,posts);
           });
        });
    })
};