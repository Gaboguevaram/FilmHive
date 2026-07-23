/* SEGUNDO EFECTO JE6/JQUERY: Menu móvil */

$(document).ready(function(){
    $("#boton-menu").on('click',()=>{
        $("#boton-menu").hide();
        $("header").css("flex-direction","column");
        $("header").css("align-items","flex-start");
        $("#cerrar-menu-movil").show();
        $("#menu-movil").slideDown();
    });

     $(document).on("click", "#cerrar-menu-movil", ()=>{
        $("#cerrar-menu-movil").hide();
        $("#menu-movil").slideUp(400, ()=> {
            $("header").css("flex-flow", "row");
            $("header").css("align-items", "center");
            $("#boton-menu").show();
        });
        
    });

});

/*-----------------------------------------*/

//Para poder ir a la página de búsqueda

document.getElementById("barraBusquedaNav").addEventListener("keypress",function(event){
    if(event.key == "Enter"){
        window.location.href = "../HTML/busqueda.html";
    }
});
