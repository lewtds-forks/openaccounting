﻿/*Copyright (C) 2015  Sao Tien Phong (http://saotienphong.com.vn)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var Vsocai = require("../../models/vsocai");
var dktk = require("../../libs/dktk");
var cktk = require("../../libs/cktk");
var async = require("async");
var underscore = require("underscore");
var controller = require("../../controllers/controllerRPT");
module.exports = function(router){
	var rpt = new controller(router,"scttk",function(req,callback){
		var condition = req.query;
		if(!condition.tk || condition.tk.trim()==""  || !condition.tu_ngay || !condition.den_ngay){
			return callback("Báo cáo này yêu cầu các tham số tk,tu_ngay,den_ngay");
		}
		if(!condition.ma_dvcs){
			condition.ma_dvcs ="";
		}
		condition.bu_tru = true;
		async.parallel(
			{
				dk:function(callback){
					var query = {};
					underscore.extend(query,condition);
					query.ngay = condition.tu_ngay;
					dktk(query,function(error,result){
						if(error) return callback(error);
						var data = {systotal:1,sysorder:0,bold:true
							,dien_giai:'Đầu kỳ'
							,ps_no:result.csum("du_no00")
							,ps_co:result.csum("du_co00")
							,ps_no_nt:result.csum("du_no_nt00")
							,ps_co_nt:result.csum("du_co_nt00")
							};
						callback(null,data);
					});
				},
				ps:function(callback){
					var query = {id_app:condition.id_app,
							tk:{$regex:"^" + condition.tk,$options:'i'},
							ma_dvcs:{$regex:condition.ma_dvcs,$options:'i'},
							ngay_ct:{$gte:condition.tu_ngay,$lte:condition.den_ngay}
							
					}
					Vsocai.find(query,function(error,result){
						if(error) return callback(error);
						result.forEach(function(r){
							r.systotal =0;
							r.sysorder =5;
							r.bold =false;
						});
						var r_tong = {systotal:1,sysorder:6,bold:true
							,dien_giai:'Tổng cộng phát sinh'
							,ps_no:result.csum("ps_no")
							,ps_co:result.csum("ps_co")
							,ps_no_nt:result.csum("ps_no_nt")
							,ps_co_nt:result.csum("ps_co_nt")
						};
						result.push(r_tong);
						
						var ps_tk_title ={systotal:0,sysorder:2,bold:true
							,dien_giai:'Phát sinh trong kỳ'
							,ps_no:0
							,ps_co:0
							,ps_no_nt:0
							,ps_co_nt:0
						};
						result.push(ps_tk_title);
						callback(null,result);
					});
					
				},
				ck:function(callback){
					var query = {};
					underscore.extend(query,condition);
					query.ngay = condition.den_ngay;
					cktk(query,function(error,result){
						if(error) return callback(error);
						var data = {systotal:1,sysorder:9,bold:true
							,dien_giai:'Cuối kỳ'
							,ps_no:result.csum("du_no00")
							,ps_co:result.csum("du_co00")
							,ps_no_nt:result.csum("du_no_nt00")
							,ps_co_nt:result.csum("du_co_nt00")
							};
						callback(null,data);
					});
				}
			},
			function(error,results){
				if(error) return callback(error);
				var data = results.ps;
				data.push(results.dk);
				data.push(results.ck);
				
				var report = underscore.sortBy(data,function(r){
					return r.sysorder;
				});
				callback(null,report);
				
			}
		);
	});
}