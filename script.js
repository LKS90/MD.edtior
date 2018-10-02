// Get the modal
var modal = document.getElementById('modal');

// Get the button that opens the modal
var login = document.getElementById("loginButton");
var logout = document.getElementById("logoutButton");
var register = document.getElementById("registerButton");
var edit = document.getElementById("editToggle");
var toggle = document.getElementById("editSwitch");
var user = document.getElementById("userButton");
var markdownArea = document.getElementById('markdown');
var pad = document.getElementById('pad');
var showResult = (document.currentScript.getAttribute('showResult') == 'true');

const regex = /LatexBegin->([^<]+).+?LatexEnd/g;

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var result = [];

window.onload = function() {
    var converter = new showdown.Converter({strikethrough: true, tables: true});

    var convertTextAreaToMarkdown = function(){
        let m;
        var markdownText = pad.value;
        while ((m = regex.exec(markdownText)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            var replaceResult = [];
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if (groupIndex == 0) {
                    replaceResult['pattern'] = match;
                }
                else {
                    replaceResult['content'] = match;
                }
                if (replaceResult['pattern'] && replaceResult['content']) {
                    try {
                        markdownText = markdownText.replace(replaceResult['pattern'], katex.renderToString(replaceResult['content']));
                    }
                    catch (error) {
                        console.log(error);
                    }
                    replaceResult['pattern'] = null;
                    replaceResult['content'] = null;
                }
            });
        }
        html = converter.makeHtml(markdownText);
        markdownArea.innerHTML = html;
    };

    pad.addEventListener('input', convertTextAreaToMarkdown);

    convertTextAreaToMarkdown();
};

// When the user clicks on the button, open the modal 
if (login) {
    login.onclick = function() {
        modal.style.display = "block";
        location.href="/login";
    }
}
if (register) {
    register.onclick = function() {
        modal.style.display = "block";
        location.href="/register";
    }
}
if (logout) {
    logout.onclick = function() {
        location.href="/logout";
    }
}

if (user) {
    user.onclick = function() {
        location.href="/";
    }
}

if (edit) {
    edit.onclick = function() {
        console.log(showResult)
        if (showResult) {
            disableMarkdown();
        }

        else {
            enableMarkdown();
        }
        showResult = !showResult;

        if (toggle) {
            toggle.checked = !toggle.checked;
        }
        event.stopPropagation();
        event.preventDefault();
    }
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
    location.href="/";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        location.href="/";
    }
}

var disableMarkdown = function() {
    markdownArea.style.visibility = 'hidden';
    markdownArea.style.width = '0%';
    pad.className = 'col-md-6 full-height';
    pad.style.width = '100%';
}

var enableMarkdown = function() {
    markdownArea.style.visibility = 'visible';
    markdownArea.style.width = '50%';
    pad.className = 'col-md-6 hidden-sm hidden-xs full-height';
    pad.style.width = '50%';
}
