angular
.module('blankapp').controller("loess_normalizationController", function($scope, $rootScope, $timeout, $mdToast,cfpLoadingBar){
  ctrl = this;
  MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

  ctrl.select_data_button_text = "Select A Dataset From Database"
  ctrl.upload_data_button_text = "Upload A Dataset"
  ctrl.use_example_data_button_text = "Use The Example Dataset"
  ctrl.submit_button_text = "Calculate"
  ctrl.download_button_text = "Download Result"
  ctrl.save_button_text = "Save Result To Database"
  ctrl.upload_data_from_input_text = "submit"
  ctrl.input_data_button_text = "Upload A Dataset By Copy & Paste"
  ctrl.load_data_from_input_show = false
  ctrl.data_source = null

  // !!!! add other ctrl initials.

  var parameters;
  ctrl.make_data_read_here = function(obj){
    make_data_ready(obj)
    parameters = JSON.parse(localStorage.getItem('parameters'))
    ctrl.column_options = delete_element_from_array(Object.keys(ooo.p[0]),'label')
    ctrl.parameters.batch_column = ctrl.column_options.includes(parameters.loess.batch_column)?parameters.loess.batch_column:ctrl.column_options[0]
    ctrl.parameters.time_column = ctrl.column_options.includes(parameters.loess.time_column)?parameters.loess.time_column:ctrl.column_options[0]
    ctrl.parameters.qc_column = ctrl.column_options.includes(parameters.loess.qc_column)?parameters.loess.qc_column:ctrl.column_options[0]
    // !!!! make all the parameters ready here.
    $scope.$watch("ctrl.parameters.qc_column",function(newValue, oldValue){
      ctrl.qc_level_options = unpack(ooo.p,ctrl.parameters.qc_column).filter(unique)
      ctrl.parameters.qc_level = ctrl.qc_level_options.includes(parameters.loess.qc_level)?parameters.loess.qc_level:[ctrl.qc_level_options[0]]
    },true)
    $scope.$watch("ctrl.parameters",function(newValue, oldValue){
      parameters.loess.qc_column = ctrl.parameters.qc_column
      parameters.loess.loess_column = ctrl.parameters.loess_column
      parameters.loess.time_column = ctrl.parameters.time_column
      parameters.loess.qc_level = ctrl.parameters.qc_level
      localStorage.setItem('parameters', JSON.stringify(parameters));
    },true)
  }

  ctrl.upload_data_from_input = function(){
    ctrl.upload_data_from_input_text = "uploading"
    var req=ocpu.call("upload_data_from_input",{
      txt:document.getElementById("dataset_input").value
    },function(session){
      ctrl.data_source = null
      sss = session
      session.getObject(function(obj){
        ooo = obj
        ctrl.make_data_read_here(obj)
        $scope.$apply()
      })
    }).done(function(){
      console.log("Data read from the textarea.")
    }).fail(function(){
      alert("Error: " + req.responseText)
    }).always(function(){
      ctrl.upload_data_from_input_text = "submit"
    })
  }

  ctrl.load_data_from_database = function(module){
    mainctrl.the_waiting_module = module
    mainctrl.toggleLeft('right',true)
  }


  ctrl.uploadFiles = function(file, errFiles) {
    ctrl.f = file;
    ctrl.errFile = errFiles && errFiles[0];
    if (file) {
      ctrl.upload_data_button_text = 'uploading'
      console.log(file)
      var req=ocpu.call("upload_dataset",{
        path:file
      },function(session){
        sss = session
        session.getObject(function(obj){
          ctrl.data_source = null
          ooo = obj
          ctrl.make_data_read_here(obj)
          $scope.$apply();
        })
      }).done(function(){
        $scope.$apply(function(){file.progress = 100;})
      }).fail(function(){
        alert("Error: " + req.responseText)
      }).always(function(){
        ctrl.upload_data_button_text = "Upload A Dataset"
      });

    }
  }



  ctrl.submit = function(){
    ctrl.submit_button_text = "Calculating"
    cfpLoadingBar.start();
    var req = ocpu.call("loess_normalization_fun",ctrl.parameters,function(session){
      sss = session
      session.getObject(function(obj){
        oo = obj
        ctrl.report = oo.report_html[0]
        // !!!! modify how to display the results.
        var dataSet = oo.data_matrix
        if(typeof(result_DataTable)!=='undefined'){
          result_DataTable.destroy();
          $('#'+'result_datatable').empty();
        }
        result_DataTable = $('#result_datatable').DataTable({
          data: dataSet,
          columns: oo.data_matrix[0].map(function(x, index){return {title:""}}),
          "ordering": false,
          "scrollX": true,
          "lengthMenu": [[15, 25, 50, -1], [15, 25, 50, "All"]]
        });
        cfpLoadingBar.complete();
        $scope.$apply();
      })
    }).done(function(){
      console.log("Calculation done.")
    }).fail(function(){
      alert("Error: " + req.responseText)
    }).always(function(){
      $scope.$apply(function(){ctrl.submit_button_text = "Calculate"})
    });
  }


  ctrl.download = function(){
    var time_stamp = get_time_string()
    // !!!! modify how to download the results.

    /*var zip = new JSZip();
    for(var i=0;i<Object.keys(plot_url).length;i++){
      zip.file(Object.keys(plot_url)[i]+".svg", Object.values(plot_url)[i], {base64: true});
    }

    zip.generateAsync({type:"blob"})
    .then(function (blob) {
      saveAs(blob, "LOESS Normalization - Plots.zip");
    });*/

      download_csv(Papa.unparse(oo.data_matrix), "LOESS Normalization "+time_stamp+".csv")
  }

  ctrl.save_result = function(){
    // trying to save result. The result must be in a form of [{},{},{}], which is a folder of the tree. In one of the {}, there is a main key indicating that this is the folder node. If the main is not found, then everything will be added to the user clicked node. For all the nodes that are not folder node, must have 'saving_content' and 'content_type' for adding the attachments. Also, these nodes's parent is to be determined by the user click.
        // !!!! modify what to save in the database.
        var time_stamp = get_time_string()
    to_be_saved_parameters = _.clone(ctrl.parameters)
    to_be_saved_parameters.e = null
    to_be_saved_parameters.f = null
    to_be_saved_parameters.p = null
        var to_be_saved =
        [{
          "id":"loess_normalization_dataset_"+time_stamp,
          "parent":undefined,
          "text":"LOESS Normalization",
          "icon":"fa fa-folder",
          "main":true,
          "analysis_type":"loess_normalization",
          "parameters":to_be_saved_parameters
        },{
          "id":"loess_normalization_dataset_"+time_stamp+".csv",
          "parent":"loess_normalization_dataset_"+time_stamp,
          "text":"LOESS Normalization.csv",
          "icon":"fa fa-file-excel-o",
          "attachment_id":"loess_normalization_dataset_"+time_stamp+".csv",
          "saving_content":btoa(unescape(encodeURIComponent(Papa.unparse(oo.data_matrix)))),
          "content_type":"application/vnd.ms-excel",
          "efp":true
        }]

        mainctrl.save_result_modal(to_be_saved)

      }
	})






























