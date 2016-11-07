/**
 * Created by Administrator on 2016/9/19 0019.
 */
var mongodb=require('./db');
function User(user){
    this.name=user.name;
    this.pwd=user.pwd;
    this.email=user.email;
};
module.exports=User;
User.prototype.save=function(callback){
    var user={
        name:this.name,
        pwd:this.pwd,
        email:this.email
    };
    mongodb.open(function(err,db){
        if(err){
            return callback(err);//错误，返回error信息
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将用户数据插入users集合
            collection.insert(user,{safe:true},function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user[0]);
            })
        })
    });
};
User.get=function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({name:name},function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,user);
            });
        });

    })
};