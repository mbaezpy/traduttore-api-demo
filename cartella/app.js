/* @author Marcos baez <marcos@baez.io> */
$(document).ready(function(){
  
    // loading guidelines with no filters by default

  
    $("#opt-data-entry").click(function(e){

      var params = {
        eventTypeId : $("#sync-eventTypeId").val() || undefined,
        residentId : $("#sync-residentId").val() || undefined
      };

      Cartella.getShareable(params, function(data){          
        console.log(data);

        CartellaView.renderForm({
          data : data,
          tmpl : $("#data-tmpl"),
          el   : $(".data-entry")
        });
      });            
    });
  
    $(".data-entry").on('click', '.opt-save button', function(e){

      var event =  {
        "eventIdCartella": Math.round(Math.random() * 1000),
        "resident": {
          "id": "aa90f1ee-6c54-4b01-90e6-d701748f0851"
        },
        "currentPhase": "closed"
      };
            
      // obtain param values, as expected in the configuration
      var updateData = [];
      Cartella.config.extraParams.forEach(function(item){
        var param = {
          name : item.name,
          value : $("#"+ item.name).val()
        };
        updateData.push(param);        
      });
      
      var eventUpdate =  {
        "status": $(e.target).attr("data-status"),
        "phase": "finished",
        "staffComment": $("#iTranslation").val(),
        "staffInternalNote": "No comments",
        "sharedFrom": "Data entering",
        "sharedInApp": true,
        "sharedInCall": false,
        "sharedInSM": false,
        "updateData": updateData
      };      
      
      console.log(eventUpdate);
      
      
      Cartella.postEvent(event, function(uri){  
        console.log(uri);   
        Cartella.postEventUpdate(uri, eventUpdate, function(uri){
          console.log(uri);
          alert("Created event");
        });
      });

    });
  
  
    $('a[data-toggle="tab"]').click(function (e) {
      console.log(e.target.hash);
      if(e.target.hash == "#events") {
        var params = {
          delegatedTo : '111'
        };
        Cartella.getEvents(params, function(data){   
          CartellaView.renderEvents({
            collection: data,
            tmpl : $("#event-tmpl"),
            el   : $(".events")            
          });          
        });        
      }
    });  
  
});

/* Basic Guidelins data manipulation functions */

var baseUrl = "https://traduttore-api.herokuapp.com/api/v1.0";

//baseUrl = "http://localhost:10010/api/v1.0";

var Cartella = {
  
  config : [],
    
  /* Load the list of guidelines 
   * @param callback function fn(collection) that recieve an array of guideline objects
   */
  getShareable : function(params, callback){
     $.getJSON(baseUrl + "/sync/shareable", params, function(data){
        Cartella.config = data.eventConfig.currentSetting;
        callback(data);
     }).fail(function(e){
       alert(e.status + " "+ e.statusText + ": " + e.responseJSON.message);
     });        
  },
  
  /* Filters the original guideline list 
   *  @param f an array of {key : <json attr>, value : <attr value>} filters over the json attributes
   *   @param callback a function fn(collection) that received the filtered array 
   */  
  postEvent : function(body, callback){

    $.ajax({
      type: "POST",
      url: baseUrl + "/sync/events",
      data: JSON.stringify(body),
      contentType : "application/json"
    }).done(function(a, status, xhr) {        
      console.log(xhr);
      callback(xhr.getResponseHeader("Location"));
    }).fail(function(e){  
       console.log(e);
       alert(e.status + " "+ e.statusText + ": " + e.responseJSON.message);
    });   
  },
  
  postEventUpdate : function(uri, body, callback){

    $.ajax({
      type: "POST",
      url: baseUrl + uri + "/updates",
      data: JSON.stringify(body),
      contentType : "application/json"
    }).done(function(a, status, xhr) {        
      console.log(xhr);
      callback(xhr.getResponseHeader("Location"));
    }).fail(function(e){  
       console.log(e);
       alert(e.status + " "+ e.statusText + ": " + e.responseJSON.message);
    });   
  },
  
  getEvents : function(params, callback){
    
     $.getJSON(baseUrl + "/sync/events", params, function(data){
        callback(data);
     }).fail(function(e){
       alert(e.status + " "+ e.statusText + ": " + e.responseJSON.message);
     });      
    
  }

};

/* Basic rendering functions */
var CartellaView = {
  /* Renders the search results summary
   * @param opt object {collection : <guidelines>, tmpl : <template>, el : <target dom>} elements
   */
  renderForm : function(opt){
    var data = opt.data;
    var config = data.eventConfig.currentSetting;
    
    $(opt.el).empty();
    
    if (!config.isShareable) {
      alert("This is not configured to be shared with family contacts.");
      return;
    }
    
    if (data.sendTo.length ==0){
      alert("No family contacts are associated with this resident.");
      return;
    }
                
    
    var tmpl = opt.tmpl.text();
        
    data.sendTo.forEach(function(item){
      tmpl = tmpl.replace(/{contact.name}/g,  item.contact.name);
      tmpl = tmpl.replace(/{contact.picture}/g,  item.contact.picture);      
      tmpl = tmpl.replace(/{relationship}/g,  item.relationship);
      tmpl = tmpl.replace(/{reaction}/g,  item.persona.expectedReactions[0]);
      tmpl = tmpl.replace(/{persona}/g,  item.persona.suggestion);
    });
    
    
    config.extraParams.forEach(function(item){      
      tmpl = tmpl.replace(/{param.title}/g,  item.title);
      tmpl = tmpl.replace(/{param.type}/g,  item.type);
      tmpl = tmpl.replace(/{param.name}/g,  item.name);      
    });
    
    tmpl = tmpl.replace(/{showCancel}/g,  config.optCancel? "" : "hide" );
    tmpl = tmpl.replace(/{showSnooze}/g,  config.optSnooze? "" : "hide");
    tmpl = tmpl.replace(/{showShare}/g,  "");  
  
    
    $(opt.el).append(tmpl);
    
  },
  
  /* Renders the search results
   * @param opt object {collection : <guidelines>, tmpl : <template>, el : <target dom>} elements
   */  
  renderEvents : function(opt){
    $(opt.el).empty();
    
    opt.collection.forEach(function(event){      
      var item = opt.tmpl.text()
        .replace(/{resident.name}/g, event.resident.name)
        .replace(/{createdOn}/g, event.createdOn);
      
      if (event.updates){
        var update = event.updates[0];
        item = item.replace(/{staffComment}/g, update.staffComment).
                    replace(/{staffName}/g, update.createdBy.name).
                    replace(/{data.name}/g, update.updateData[0].name).
                    replace(/{data.value}/g, update.updateData[0].value);
        
      }
                        
      $(opt.el).append(item);
    });
     
  }  
};