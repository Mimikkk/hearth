# Math

## Methods meanings

- `X` - Mutates the **first parameter** and returns it.
- `X_` postfix `_` - Mutates **last parameter** and returns it.
- `Xed` postfix `ed` - Creates a copy with method applied and returns it.
- example:
    - `add(x, y)` - add **Y** to **X** and return mutated **X**.
    - `add_(x, y, into)` - add **Y** to **X** and return the result into **Z**.
    - `added(x, y)` - add **Y** to **X** and return as new **Z**.
- `fill(self, ...)` - fill **X** with values from remaining parameters.
- `fill_(into, from)` - mutate **first** parameter with values from **second** parameter.
- `clone(from)` - create deep new instance with values from **first** parameter.
- `clone_(from, into)` - mutate **second** parameter with deep values from **first** parameter.
- `create(...)` - create new instance with values from parameters.
- `copy(from)` - create shallow new instance with values from **first** parameter as references and return it.
- `copy_(from, into)` - create shallow new instance with values from **first** parameter as references and return it.
- `empty()` - create new instance with default values.

## difference between clone and copy

see [shallow-copy vs deep-copy](https://stackoverflow.com/questions/184710/what-is-the-difference-between-a-deep-copy-and-a-shallow-copy)

- `clone` - deep-copy - creates a new instance with values from **first** parameter as copies.
- `copy` - shallow-copy - creates a new instance with values from **first** parameter as references.

