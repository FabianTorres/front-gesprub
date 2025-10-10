# Changelog
Todos los cambios significativos en este proyecto se documentarán en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [1.2.0] - 2025-10-08

### Added
-   Se agrega al dashboard la vista general del proyecto
-   Se agrega al dashboard la vista por componente
-   Se agrega columna "Jira" a la vista de casos y al exportar a Excel
-   Se agrega un contador de casos en la vista de casos.
-   Ahora guarda los filtros seleccionados incluso aunque cambie de pagina

### Changed
-   Ahora en la busqueda de casos, tambien se puede buscar por estado de la ultima evidencia
-   En el historial ahora se puede editar el rut y el jira, pero se agregara como ejecucion nueva

## [1.1.0] - 2025-10-03

### Added
-   Se agrega una actualizacion masiva para casos de prueba

## [1.0.2] - 2025-09-30

### Added
-   Se agrega un filtro para ver "mis casos de prueba asignados"
### Changed
-   Ahora al agregar una evidencia, se bloquea el botón Guardar Evidencia hasta que se logre subir correctamente o falle
### Fixed
-   Se soluciona un error que impedia crear casos cuando el componente estaba vacio

## [1.0.1] - 2025-09-29

### Fixed
-   Se modifica el dashboard para que veamos solo los usuarios activos

## [1.0.0] - 2025-09-26

### Added
-   Version inicial para produccion

## [0.8.3] - 2025-09-24

### Fixed
-   Se soluciona un problema al asignar casos
### Added
-   Se agrega funcionalidad donde no permite ejecutar casos sin que esten asignados

## [0.8.2] - 2025-09-11

### Fixed
-   Se soluciona un problema al ejecutar nuevo caso, ahora hace el cambio autotmatico en el Muro Kanban.
-   Se soluciona problema con la importacion de datos

## [0.8.1] - 2025-09-09

### Added
-   Se agrega funcionalidad de muro Kanban

## [0.8.0] - 2025-09-08

### Added
-   Se agrega la funcionalidad de Muro de tareas-asignaciones

## [0.7.0] - 2025-09-03

### Added
-   Se agrega la funcionalidad de Dashboard

## [0.6.2] - 2025-09-02

### Added
-   Se agrega funcionalidad de importar casos con asistente de carga de datos
### Fixed
-   Se actualiza la fecha de ultimo login para que ahora si muestre el dato correcto

## [0.6.1] - 2025-09-02

### Changed
-   Ahora al agregar un nuevo caso de forma manual, tambien hace validaciones para detectar el porcentaje de similitud con los casos actuales y si hay duplicados

## [0.6.0] - 2025-08-27

### Added
-   Se agrega funcionalidad de importar casos, con validaciones y sistemas que evitan errores al importar.
### Fixed
-   Se corrigió un problema con el campo "fecha_evidencia"

## [0.5.2] - 2025-08-26

### Fixed
-   Se corrigió un problema al obtener el rol del usuario la primera vez.
### Changed
-   Ahora tambien se puede ver la version en las paginas `Registro` y `Login`.


## [0.5.1] - 2025-08-20

### Added
-   Ahora se puede desactivar una ejecución en el Historial.
-   Se agrega CRUD de fuentes de informacion.

### Changed
-   Se mejoró la información de las fuentes en el Historial y en Ejecucion.
-   Se agregó el estado "Eliminado"

## [0.5.0] - 2025-08-19

### Added
-   Se agrego la capacidad de ingresar varias fuentes a cada caso

## [0.4.2] - 2025-08-19

### Changed
-   Se cambió el formulario. Ahora se muestra en todos los proyectos.

## [0.4.1] - 2025-08-18

### Added
-   Se agregó un campo para componente: ámbito.
-   Se agregó a la configuracion el campo ámbito.
-   Se añadió la visualización de la ultima versión del caso que se esta ejecutando
### Changed
-   Se modificó la tarjeta de evidencias en el historial. Ahora se puede cambiar una evidencia a otro caso.

## [0.4.0] - 2025-08-14

### Added
-   Se agregaron las configuraciones para estados, proyectos y criticidades.
-   Se agregaron opciones de importar y exportar en casos


## [0.3.1] - 2025-08-14

### Added
-   Ahora se valida el rol del usuario al entrar.
-   Se añade un boton de Cerrar Sesión
### Changed
-   Ahora cuando se cambia la contraseña, se cierra sesión y manda al login
-   Ahora cuando se cambia el nombre de usuario, se actualiza localmente en caché
### Fixed
-   Se solucionó problema que impedía ver los iconos correctos en el `Historial`


## [0.3.0] - 2025-08-13

### Added
-   Se agrego pagina de perfil personal, con edicion de perfil y cambio de contraseña
-   Se agrego el cuadro superior de perfil personal
### Changed
-   Se modificaron las rutas para mejorar el flujo de la aplicación


## [0.2.0] - 2025-08-11

### Added
-   Se refactorizó el codigo para lea los estados dinámicamente. Paginas afectadas: `Casos`, `Ejecucion` y `Historial`
### Changed
-   Se mejoraron componentes menores de usuarios


## [0.1.1] - 2025-08-11

### Added
-   Se agregó la funcionalidad de añadir mas de un archivo por evidencia.
-   Se añadio el campo rut en evidencia, con validacion modulo 11

### Changed
-   Se cambiaron y mejoraron validaciones de campos en ejecucion (Rut, version y otros)

## [0.1.0] - 2025-08-08

### Added
-   Estructura inicial del proyecto Gesprub con Angular 19, PrimeNG 19 y Tailwind
-   Funcionalidades iniciales para `Componente`, `Casos`, `Ejecucion` y `Historial`.
-   Se agregó la funcionalidad de fuentes de información, tanto de fuentes como de formularios

### Fixed
-   Se corrigió un error que impedía que al ejecutar una evidencia se guardara con el numero de jira
-   Se corregió error que ponía la versión donde debía ir el número formulario

### Changed
-   Se actualizó la funcionalidad de usuarios con el formato de tablas e iconos genericos del proyecto