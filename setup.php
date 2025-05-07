<?php
    // Load configuration
    include_once(dirname(__FILE__) . "/config/config.inc.php");
    
    header('Content-Type: text/html; charset=utf-8');

    if (isset($CONFIG['php_session_timeout']) && $CONFIG['php_session_timeout'] > 0) {
        // Set the maxlifetime of session
        ini_set("session.gc_maxlifetime",  $CONFIG['php_session_timeout']);
  
        // Also set the session cookie timeout to 0 (until the browser is closed)
        ini_set("session.cookie_lifetime", 0);
    }

    session_start();

    if (!isset($_SESSION['login']) || ! $_SESSION['login']) {
        header('Location: login');
    }
    
?>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  <title>ReBooth:setup</title>

  <!-- favicon for all devices -->
  <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png">
  <link rel="manifest" href="/images/icons/site.webmanifest">
  <link rel="mask-icon" href="/images/icons/safari-pinned-tab.svg" color="#5bbad5">
  <link rel="shortcut icon" href="/images/icons/favicon.ico">

  <!-- FontAwesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css" integrity="sha256-h20CPZ0QyXlBuAw7A+KluUYx/3pK+c7lYEpqLTlxjYQ=" crossorigin="anonymous" />  

  <!-- JQuery -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" integrity="sha512-bLT0Qm9VnAYZDflyKcBaQ2gg0hSYNQrJ8RilYldYQ1FxQYoCLtUjuuRuZo+fjqhx/qtq/1itJ0C2ejDxltZVFg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  
  <!-- Bootstrap 4.x -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js" integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.min.js" integrity="sha384-+sLIOodYLS7CIrQpBjl+C7nPvqq+FbNUBDunl/OZv93DB7Ln/533i8e/mZXLi/P+" crossorigin="anonymous"></script>

  <!-- Bootstrap 4 datetime picker -->
  <script type="text/javascript" src="/js/moment-with-locales.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.1.2/css/tempusdominus-bootstrap-4.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tempusdominus-bootstrap-4/5.1.2/js/tempusdominus-bootstrap-4.min.js"></script>  

  <!-- Bootstrap 4 alerts, confirm, prompt boxex -->
  <script src="js/bootbox.min.js"></script>

  <!-- Toastr -->
  <script src="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>
  <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css">

  <!-- JSCookies -->
  <script src="js/js.cookie.js"></script>

  <!-- Rebooth -->
  <link rel="stylesheet" href="css/rebooth.css?0.02">
  <script src="js/utils.js?0.00"></script>
  <script src="config/config.js?0.01"></script>
  <script src="js/rebooth.js?0.02"></script>
  <script src="js/common.js"></script>

<style>
body {
    background-image: url("images/logo.png");
    background-repeat: no-repeat;
}
.credits {
    font-size: 0.8rem;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";    
}
</style>
  
<script>

const userName        = '<?=@$_SESSION["user"]?>';

$(document).ready(function() {
    
    
    var invitations = [];
    
    keepAliveSession(); // keep alive PHP session 

    $('#class-time').datetimepicker({
        locale: 'it',
        icons: {
            time: "fas fa-clock"
        }
    });
    
    // Hide error panen
    $('#board-panel').hide();

    $('#class-code').val('<?=@$_SESSION["classCode"]?>');

    // Load invitations if any in current session
    //let inv = null;
    try {
        invitations = JSON.parse('<?=@$_SESSION["invitations"]?>');
        if (invitations == null) invitations = [];
    } catch (e) {
        invitations = [];
    }

    initEmailList();
    
    function initEmailList() {
        $('#email-list').html('');
        
        if (invitations.length > 0) {
            
            $("#email").val("");
            invitations.forEach(i => {
                $('#email-list').append(
                    '<div class="input-group mb-1"><div class="email-item form-control">'+i.email+'</div><div class="input-group-append"><span class="email-item-delete input-group-text unselectable cursor-pointer bg-warning">&times;</span></div></div>'
                );
            });
            
            $('#start-class').removeClass('disabled');
            $('#start-class-no-invitations').removeClass('disabled');
            $('#email-list-button-bar').show();
        } else {
            $('#start-class').removeClass('disabled').addClass('disabled');
            //$('#start-class-no-invitations').removeClass('disabled').addClass('disabled');
            $('#email-list-button-bar').hide();    
        }        
    }

    
    $('#refresh-pins').on('click', function() {
        
        bootbox.confirm({
            title: "Do you really want to replace old invitation links?",
            message: "If you regenerate the access codes, you need to resend the invitations because the old invitation links will no longer work. Do you really want to continue?",
            centerVertical: true,
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-success'
                }
            },           
            callback: (r) => {
                if (!r) return;
                
                const pins = getPins(invitations.length, PinLength);
                
                for(let i = 0; i < invitations.length; i++) {
                    invitations[i].pin = pins[i];
                }
                
            }
        });
        
    });
    
    $('#add-email').on('click', function() {
       var el = $('#email').val().split(/[\r\n ,;]+/);
       var good = [], bad = [];
       
       el.forEach(e => {
           e = e.replaceAll(/[<>]/g, '').trim();
           if (e == "") return;
           
           if (!Student.validateEmail(e) || invitations.find((i) => { return i.email == e })) {
               bad.push(e);
           } else {
               good.push(e);
           }
       });
       
       //if (good.length == 0) return false;
       
       good.forEach(email => {
           
           let pin = null;
           do {
               pin = getPins(1, PinLength)[0];
               if (invitations.find(i => { return (i.pin == pin); })) pin = null;
           } while (!pin)
           
           invitations.push({email: email, pin: pin});
           
           $('#email-list').append(
               '<div class="input-group mb-1"><div class="email-item form-control">'+email+'</div><div class="input-group-append"><span class="email-item-delete input-group-text unselectable cursor-pointer bg-warning">&times;</span></div></div>'
           );
       });
       
       $('#email').val(bad.join("\n"));
      
       
       if (invitations.length > 0) {
           $('#start-class').removeClass('disabled');
            $('#start-class-no-invitations').removeClass('disabled');
           
           $('#email-list-button-bar').show();    
       } else {
           $('#start-class').removeClass('disabled').addClass('disabled');
           //$('#start-class-no-invitations').removeClass('disabled').addClass('disabled');
           $('#email-list-button-bar').hide();
       }
       
       $('#show-origin').html('');
    });
    
    
    $('#email').keypress(function(e) {
        if(e.which === 13) {
            e.preventDefault();
            $('#add-email').trigger('click');
        }
    });
    
    $('#email-list').on('click', '.email-item-delete', function(e) {
        
        var email = $(this).parent().siblings('.email-item').text();
        var i = invitations.findIndex(i => { return i.email == email } );
        
        if (i > -1) invitations.splice(i, 1);
        
        $(this).parent().parent().remove();
        
        if (invitations.length == 0) {
            $('#start-class').removeClass('disabled').addClass('disabled');
            //$('#start-class-no-invitations').removeClass('disabled').addClass('disabled');
           
            $('#email-list-button-bar').hide();
        }
        
        $('#show-origin').html('');
    });    
    
    $('#class-code').on('keydown', function(e) {
        console.log(e.keyCode);
        
        if (e.keyCode >= 32 && [48,49,50,51,52,53,54,55,56,57].indexOf(e.keyCode | e.which) == -1) {
            console.log('wrong');
            e.preventDefault();
            return false;
        }
        
    });
    
        
    $('#start-class,#start-class-no-invitations').on('click', function() {
        
        if ($(this).hasClass('disabled')) return;
        
        let sendInvitations = $(this).attr('id') == 'start-class' ? 1 : 0;
        
        // A Unix timestamp is always UCT based 
        // If a class time has been set we need to consider the local timezone 
        // offset (in seconds)
        let t = $('#class-time').datetimepicker('viewDate').format();
        
        // Save current class to cookie
        Cookies.set('current-class', {invitations: invitations, classCode: $('#class-code').val()}, { expires: 14 });        
        $.ajax({
            type: "POST",
            url: "/actions/send",
            data: {
                'invitations': invitations,
                'classCode': $('#class-code').val(),
                'classTime': t,
                'sendInvitations': sendInvitations
            },
//          contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                if (data.Result == "OK") {
                    console.log(data);
                    window.location.replace("/session");
                } else {
                    $("#board").html(data.Message);
                    $('#board-panel').show();
                    
                }
            },
            failure: function(errMsg) {
                // HTML ERRORS HERE
                
                $("#board").html(errMsg);
                $('#board-panel').show();
            }
        });        
        
        
    });

    // Save session data to file
    $('#save-to-file').on('click', function() {
        const data = {
            invitations: invitations,
            classCode:   $('#class-code').val()
        };
        var blob = new Blob([JSON.stringify(data, null, '    ')], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        
        var t = getDateTime();
        
        var fileName = t.yyyymmdd + '-' + t.hhmmss + '-' + userName.replace(/@.*$/, '') + ($('#class-code').val() ? '-c' + $('#class-code').val() : '') + ".rebooth";
        
        downloadDataURL(url, fileName);
    });

    $('#load-from-cookie').on('click', function() {
        const classCookie = Cookies.get('current-class');

        data = (classCookie === undefined ? undefined : JSON.parse( classCookie ));
        
        if (typeof data === 'object') {

            bootbox.confirm({
                title: "Do you really want to replace your class setup?",
                message: "By loading a new class setup you'll replace the current one. Do you really want to continue?",
                centerVertical: true,
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-success'
                    }
                },           
                callback: (r) => {
                    if (!r) return;
                    invitations = [];
                    invitations = data.invitations;
                    $('#class-code').val(data.classCode);
                    
                    $('#show-origin').html('');
                    
                    initEmailList();
                }
            });
        } else {
            toastr.info("No previously used class has been found on this PC", "No saved class", {positionClass: "toast-middle", timeOut: 2500} );
        }
        
        
    });

    $('#load-from-file').on('change', (e) => {
        
        e.preventDefault();
        
        var me = $('#load-from-file')[0];
        
        if (me.files.length == 0) {
            me.value = null; // Otherwise you can't load the same file more times
            return;
        }
        
        var file = me.files[0];

        bootbox.confirm({
            title: "Do you really want to load a new class setup?",
            message: "By loading a new class setup you'll replace the current one. Do you really want to continue?",
            centerVertical: true,
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-success'
                }
            },           
            callback: (r) => {
                if (!r) return;
        
                // read the file
                var reader = new FileReader();
                reader.addEventListener('load', (e) => {
                    var data = JSON.parse(e.target.result); 
                    
                    if (!data || typeof data.invitations == 'undefined' || typeof data.classCode == 'undefined') {
                        bootbox.alert({
                            centerVertical: true,
                            title: "Failed to load the file",
                            message: "Failed to load the file. Maybe the file type is wrong or it is already in use by another application.",
                        });
                        return;
                    }
                    
                    invitations = [];
                    invitations = data.invitations;
                    $('#class-code').val(data.classCode);
                    
                    initEmailList();
                    
                    $('#show-origin').html('(<em>' + file.name + '</em>)');
                    
                });
                reader.addEventListener('error', (e) => {
                    bootbox.alert({
                        centerVertical: true,
                        title: "Failed to load the file",
                        message: "Failed to load the file. Maybe the file type is wrong or it is already in use by another application.",
                    });
                });
                reader.readAsText(file);
                
            }
        });

        me.value = null; // Otherwise you can't load the same file more times
        
    });
    

});




</script>

</head>
<body>
  <div class="container-fluid" style="width: 60rem">
  
    <div class="card mt-2 bg-light">
      <div class="card-header">
          <div class="display-4">Create a class</div>
      </div>
      <div class="card-body">



        
              
        <div class="row">
          <div class="col-md-12">
            <h5>Setup invitations <span id="show-origin"></span></h5>
          </div>
        </div>
        <div class="row ">
          <div class="col-md-12">
            <div class="row">
              <div class="col-md-12 input-group" id="email-list">
              </div>
            </div>
            <div class="row mb-3" id="email-list-button-bar">
              <div class="col-md-12">
                  <button id="save-to-file" class="btn btn-light btn-sm float-right"><i class="fas fa-file-export"></i> Save class setup to file</a>
                  <button id="refresh-pins" class="btn btn-light btn-sm float-right" title="Regenerate invitation link codes invalidating current ones"><i class="fas fa-key"></i> Replace old invitation links</a>
                  
              </div>
            </div>
          
            <div class="row">
              <div class="col-md-12 input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text unselectable bg-primary text-white">@</span>
                </div>
                <textarea name="email" id="email" class="form-control" placeholder="Insert email addresses one per line or separated by commas or spaces. You may leave any names or other text. Anything that is not an email address will be skipped."></textarea>
              </div>
              
            </div>
            <div class="row">
              <div class="col-md-12">
                
                <button id="add-email" class="btn btn-primary btn-sm ml-2 mt-2 mb-2 float-right"><i class="fas fa-user-plus"></i> Add to the class</button>
                <label for="load-from-file" id="load-from-file-label" class="btn btn-light btn-sm  mt-2 mb-2 float-right"><i class="fas fa-file-import"></i> Load class setup from file</label>
                <input type="file" id="load-from-file" style="display: none" accept=".rebooth">
                
                <button id="load-from-cookie" class="btn btn-light btn-sm ml-2 mt-2 mb-2 float-right"><i class="fas fa-sync"></i> Reload the last class you've used on this PC</button>   
                
              </div>
            </div>


            <div class="row mt-1">
              <div class="col-md-6 form-group">
                <label for="class-code" class="label-small">Unique code for this class</label>
                <input type="text" id="class-code" class="form-control" placeholder="enter a number" maxlength="4" size="4" min="0" max="9999" />
                
                <div style="font-size: 0.8rem; text-align: justify;">Enter an unique code if you're going to use your email address to create different classes on more PCs or devices (e.g. 1 for the 1<sup>st</sup> class, 2 for the 2<sup>nd</sup>, &hellip;). You can leave empty if you're not going to create more than one class.</div>
              </div>
              
              <div class="col-md-6 form-group">
                <label for="class-time" class="label-small">Class time</label>
                <div class="input-group date" id="class-time" data-target-input="nearest">
                    <input type="text" class="form-control datetimepicker-input" data-target="#class-time"/>
                    <div class="input-group-append" data-target="#class-time" data-toggle="datetimepicker">
                        <div class="input-group-text"><i class="fas fa-calendar-alt"></i></div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; text-align: justify">Set the class time. Please note that this is just an indication that will be reported in the invitation emails for your convenience. ReBooth won't schedule or enforce this class in any way. Leave empty if not needed.</div>                
              </div>
            </div>
            
            
            <div class="row mt-4">
              <div class="col-md-7">
<?php
    if ($CONFIG['send_invitations']) {
?>
                <button id="start-class" class="btn btn-success disabled w-100"><i class="fas fa-mail-bulk"></i>&nbsp; Send invitations and go to the class</button>
<?php
    } else {
?>
                <span class="btn btn-light disabled w-100">Send invitation feature is not configured</span>
<?php
    }
?>
              </div>
              <div class="col-md-5">
                <button id="start-class-no-invitations" class="btn btn-success w-100"><i class="fas fa-door-open"></i>&nbsp; Just go to the class</button>
              </div>
              
            </div>            
            
          </div>

        </div>
        <div class="row mt-4">
          <div class="col-md-12" id="board-panel">
            <h6>Something went wrong:</h6>
            <div class="alert alert-primary" role="alert" id="board"></div>
          </div>
        
        </div>


      </div>

      <div class="card-footer">

        <a class="btn btn-sm btn-outline-dark" href="session"><i class="fas fa-sign-in-alt"></i> Go (back) to the class and manually add new booths</a>
        <a class="btn btn-sm btn-outline-dark" href="logout"><i class="fas fa-sign-out-alt"></i> Logout</a>
      
      
      </div>
      
      
          
    </div>  
    
    
    
  
 
  </div>
</body>
</html>
