# Changelog
Todos los cambios significativos en este proyecto se documentarán en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/lang/es/).


## [0.2.0] - 2025-08-11

### Added
-   Se refactorizó el codigo para lea los estados dinámicamente. Paginas afectadas: `Casos`, `Ejecucion` y `Historial`


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