angular
    .module('blankapp').controller("metamappController", function($scope, $rootScope, $timeout, $mdToast){
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
        ctrl.parameters.do_not_do = false
        // !!!! make all the parameters ready here.
        parameters = JSON.parse(localStorage.getItem('parameters'));
        ctrl.column_options = Object.keys(ooo.f[0])
        ctrl.parameters.compound_label = ctrl.column_options.includes(parameters.metamapp.compound_label)?parameters.metamapp.compound_label:'label'
        ctrl.parameters.pubchemid = ctrl.column_options.includes(parameters.metamapp.pubchemid) ? parameters.metamapp.pubchemid : Object.keys(ooo.f[0])[0]
        ctrl.parameters.kegg = ctrl.column_options.includes(parameters.metamapp.kegg)?parameters.metamapp.kegg:Object.keys(ooo.f[0])[1]
        ctrl.parameters.smiles = ctrl.column_options.includes(parameters.metamapp.smiles)?parameters.metamapp.smiles:Object.keys(ooo.f[0])[2]
        ctrl.parameters.pvalue = ctrl.column_options.includes(parameters.metamapp.pvalue)?parameters.metamapp.pvalue:Object.keys(ooo.f[0])[3]
        ctrl.parameters.foldchange = ctrl.column_options.includes(parameters.metamapp.foldchange)?parameters.metamapp.foldchange:Object.keys(ooo.f[0])[4]
        ctrl.parameters.fold_change_critical = parameters.metamapp.fold_change_critical


        $scope.$watch("ctrl.parameters",function(){
          parameters.metamapp.compound_label = ctrl.parameters.compound_label
          parameters.metamapp.pubchemid = ctrl.parameters.pubchemid
          parameters.metamapp.kegg = ctrl.parameters.kegg
          parameters.metamapp.smiles = ctrl.parameters.smiles
          parameters.metamapp.pvalue = ctrl.parameters.pvalue
          parameters.metamapp.foldchange = ctrl.parameters.foldchange
          parameters.metamapp.fold_change_critical = ctrl.parameters.fold_change_critical
          localStorage.setItem('parameters', JSON.stringify(parameters));


          data_f = ooo.f
          dataSet = data_f.map(x=>_.pick(x, [ctrl.parameters.pubchemid, ctrl.parameters.kegg, ctrl.parameters.smiles, ctrl.parameters.compound_label, ctrl.parameters.pvalue, ctrl.parameters.foldchange]))


          if(typeof(result_DataTable)!=='undefined'){
           result_DataTable.destroy();
           $('#'+'result_datatable').empty();
          }
          result_DataTable = $('#result_datatable').DataTable({
            data: dataSet.map(x => Object.values(x)),
            columns: Object.keys(dataSet[0]).map(function(x, index){return {title:x.replace(".","_")}}),
            "ordering": false,
            "scrollX": true,
             "lengthMenu": [[15, 25, 50, -1], [15, 25, 50, "All"]]
          });



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
        ctrl.upload_data_button_text = 'uploading'
        // when user simply upload a dataset,create a temp project.
        var project_db = new PouchDB('https://tempusername:temppassword@metda.fiehnlab.ucdavis.edu/db/project');
        var time_stamp = get_time_string()
        var temp_project_id = "temp"+time_stamp
        var new_project = {
          _id:temp_project_id
        }
        project_db.put(new_project).then(function(doc){
          ctrl.f = file;
          ctrl.errFile = errFiles && errFiles[0];
          if (file) {
            console.log(file)
             var req=ocpu.call("upload_dataset",{
               path:file,
               project_id:temp_project_id
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
        })


      }



      ctrl.submit = function(){
        ctrl.submit_button_text = "Calculating"
ctrl.parameters.fun_name="metamapp_fun"
        var req = ocpu.call("call_fun",{parameters:ctrl.parameters},function(session){
          sss = session
          session.getObject(function(obj){
            oo = obj
            ctrl.report = oo.report_html[0]


            var chemsim_krp_07_url = "https://metamapp.fiehnlab.ucdavis.edu/" + oo.session_id[0] + "/files/chemsim_krp_07.sif"
            var node_attributes_chemsim_krp_07_url = "https://metamapp.fiehnlab.ucdavis.edu/" + oo.session_id[0] + "/files/node_attributes_chemsim_krp_07.tsv"
            UrltoBase64(chemsim_krp_07_url, function(base_chemsim_krp_base64){
              chemsim_krp_07_base64 = base_chemsim_krp_base64
            })

            UrltoBase64(node_attributes_chemsim_krp_07_url, function(node_attributes_chemsim_krp_base64){
              node_attributes_chemsim_krp_07_base64 = node_attributes_chemsim_krp_base64
            })


/*cy = cytoscape({

  container: document.getElementById('cy'), // container to render in

  elements: [ // list of graph elements to start with
    { // node a
      data: { id: 'a' }
    },
    { // node b
      data: { id: 'b' }
    },
    { // edge ab
      data: { id: 'ab', source: 'a', target: 'b' }
    }
  ],

  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle'
      }
    }
  ],

  layout: {
    name: 'grid',
    rows: 1
  }

});*/




            // !!!! modify how to display the results.
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

        var zip = new JSZip();
        for(var i=0;i<Object.keys(plot_url).length;i++){
          zip.file(Object.keys(plot_url)[i]+".svg", Object.values(plot_url)[i], {base64: true});
        }

        zip.generateAsync({type:"blob"})
        .then(function (blob) {
            saveAs(blob, "MetaMapp Pathway Mapping - Plots.zip");
        });

        //download_csv(Papa.unparse(oo.result), "MetaMapp Pathway Mapping.csv")
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
          "id":"metamapp_dataset_"+time_stamp,
          "parent":undefined,
          "text":"MetaMapp Pathway Mapping",
          "icon":"fa fa-folder",
          "main":true,
          "analysis_type":"metamapp",
          "parameters":to_be_saved_parameters
        },{
          "id":"metamapp_network_"+time_stamp+".sif",
          "parent":"metamapp_dataset_"+time_stamp,
          "text":"MetaMapp Network.sif",
          "icon":"fa fa-file-code-o",
          "attachment_id":"metamapp_network_"+time_stamp+".sif",
          "saving_content":chemsim_krp_07_base64.split("base64,")[1],
          "content_type":"application/octet-stream"
        },{
          "id":"metamapp_node_attributes_"+time_stamp+".tsv",
          "parent":"metamapp_dataset_"+time_stamp,
          "text":"MetaMapp Node Attributes.tsv",
          "icon":"fa fa-file-code-o",
          "attachment_id":"metamapp_node_attributes_"+time_stamp+".tsv",
          "saving_content":node_attributes_chemsim_krp_07_base64.split("base64,")[1],
          "content_type":"application/octet-stream"
        }]

       /* var to_be_saved =
        [{
          "id":"metamapp_dataset_"+time_stamp,
          "parent":undefined,
          "text":"MetaMapp Input",
          "icon":"fa fa-folder",
          "main":true,
          "analysis_type":"metamapp",
          "parameters":to_be_saved_parameters
        },{
          "id":"metamapp_network_input"+time_stamp+".csv",
          "parent":"metamapp_dataset_"+time_stamp,
          "text":"MetaMapp Input.csv",
          "icon":"fa fa-file-excel-o",
          "attachment_id":"metamapp_network_input"+time_stamp+".csv",
          "saving_content":btoa(unescape(encodeURIComponent(Papa.unparse(oo.result)))),
          "content_type":"application/vnd.ms-excel"
        }]*/

        mainctrl.save_result_modal(to_be_saved)

      }
	})






























