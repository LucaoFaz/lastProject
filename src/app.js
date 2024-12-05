import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const usuarios = []; // Array para armazenar os usuários
const SECRET = "chave-secreta"; // Chave secreta para gerar JWT

const app = express(); //representa a aplicação Express
app.use(express.json());

const alunos = [
    {
        id: 1,
        nome: "Asdrubal",
        ra: "11111",
        nota1: 8.5,
        nota2: 9.5
    },
    {
        id: 2,
        nome: "Lupita",
        ra: "22222",
        nota1: 7.5,
        nota2: 7
    },
    {
        id: 3,
        nome: "Zoroastro",
        ra: "33333",
        nota1: 3,
        nota2: 4
    },
];

// registar novo usuário
app.post("/register", async (req, res) => {
    const {username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json( {message: "Usuário e senha são obrigatórios"} )
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    usuarios.push( {username, password: hashedPassword} );
    res.status(201).json( {message: "Usuário registrado com sucesso"} )
});

app.post("/login", async (req, res) =>{
    const {username, password} = req.body;

    const user = usuarios.find(u => u.username === username);
    if(!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json( {message : "Credenciais inválidas."} );
    }

    const token = jwt.sign( {username}, SECRET, {expiresIn: "1h"} );
    res.status(200).json( {token} );
});

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json( {message: "Token nao fornecido"} );
    }

    const token = authHeader.split(" ")[1];
    try {
        jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(403).json( {message: "Token inválido!"} );
    }
}

app.get("/", (req, res) => {
    res.status(200).send("Hello World!");
});
// app.get define um manipulador (handler) para requisições HTTP do tipo GET na rota /.
// Quando essa rota é acessada, a função de callback é executada. Ela:
// Ajusta o status da resposta para 200 (OK).
// Envia a mensagem "Hello World." ao cliente como resposta.


app.get("/alunos", autenticar,(req, res) => {
    res.status(200).json(alunos); //envia uma resposta JSON
});


app.post("/alunos", autenticar, (req, res) => {
    const {id, nome, ra, nota1, nota2} = req.body;

    if (!id || !nome || !ra || nota1 == undefined || nota2 == undefined) {
        return res.status(400).json( {message: "Todos os campos são obrigatórios!"} );
    }
    alunos.push( {id, nome, ra, nota1, nota2} );
    res.status(201).send( {message: "Aluno cadastrado com sucesso!"} );
})

function buscaAluno(id) {
    return alunos.findIndex(aluno =>  aluno.id === Number(id));
}

function media(nota1, nota2) {
    if (isNaN(nota1) || isNaN(nota2) || nota1 == null || nota2 == null) {
        return null;
    }
    return (nota1 + nota2) / 2;
}

//listar a media de todos os alunos
app.get("/alunos/medias", autenticar, (req, res) => {
    const medias = alunos.map(aluno => ({
        nome: aluno.nome,
        media: media(aluno.nota1, aluno.nota2)
    }));
    res.status(200).json(medias);
});

//listar alunos aprovados e reprovados
app.get("/alunos/aprovados", (req, res) => {
    const aprovados = alunos.map(aluno => ({
        nome: aluno.nome,
        status: media(aluno.nota1, aluno.nota2) >= 6 ? "Aprovado" : "Reprovado"
    }));
    res.status(200).json(aprovados);
});

app.get("/alunos/:id", autenticar, (req, res) =>{
    const index = buscaAluno(req.params.id);
    if (index === -1) {
        return res.status(404).json( {message: "Aluno não encontrado!"} );
    }
    res.status(200).json(alunos[index]);
});

app.put("/alunos/:id", autenticar, (req, res) =>{
    const index = buscaAluno(req.params.id); //req.params.id = contem o id do Aluno fornecido na URL
    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }
    alunos[index] = { ...alunos[index], ...req.body };
    
    res.status(200).json(alunos[index]);
});

// /:id é um parametro de rota que define qual Aluno deve ser atualizado


app.delete("/alunos/:id", (req, res) =>{
    const index = buscaAluno(req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: "Aluno não encontrado!" });
    }

    alunos.splice(index, 1); //remove 1 elemento na posição index!
    res.status(200).json({message: "Aluno removido com sucesso!"});
    console.log(alunos);
});



export default app;