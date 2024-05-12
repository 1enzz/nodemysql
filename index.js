const {
    createPool
} = require('mysql');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const port = 3000; // Escolha a porta que deseja usar para o servidor
app.use(bodyParser.json());
app.use(cors());


const pool = createPool({
    host: "localhost",
    user: "adm",
    password:"NvEn$$01%",
    database: "bdclimup",
    connectionLimit: 10,
    insecureAuth: true
})


//login empresa
app.post('/api/loginEmpresa', (req, res)=>{
    const {cnpjEmpresa, senhaEmpresa} = req.body;
    pool.query('SELECT idEmpresa, nomeEmpresa, senhaEmpresa FROM tbempresa where cnpjEmpresa = ?', [cnpjEmpresa], (error,result) =>{
        //quando o if tem como parametro somente uma variavel, verificamos se essa variavel retorna true ou false
        //nessa relação com banco quando da algum erro no banco, error retorna true sempre por padrão
        if(error){
            return res.status(500).json({ message: 'Erro ao fazer login' });
        }


        //aqui verifica se houve alguma resposta da nossa requisição inicial, se houve algum retorno do select com cnpj
        //se não houve, o result.lenght vai ser 0 e vai retornar para a aplicação erro
        if(result.length === 0){
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });

        }
        //caso seja maior q zero, vamos pegar a primeira posição do nosso array q armazena o resultado da query
        //e armazenar em uma variavel chamada resquery para manipular os dados de retorno mais facilmente

        const resquery = result[0];
        

        //aqui verificamos se a senha q o nosso usuario enviou da tela é diferente da que retornou do banco de dados, de acordo com o cnpj fornecido
        //se nao for, retorna um código de erro junto com a mensagem de erro
        if(senhaEmpresa !== resquery.senhaEmpresa){
            return res.status(401).json({ message: 'Nome de usuário ou senha incorretos' });
        }

        //caso seja igual, pegamos o id e o nome enviados na query e mandamos de volta para tela

        const id = resquery.idEmpresa;
        const nmEmpresa = resquery.nomeEmpresa;
        return res.status(200).json({retorno: 'Login bem sucedido', nmEmpresa,id});
    })
})


//login coolaboradores
app.post('/api/loginColaborador', (req, res)=>{
    const {emailColaborador, senhaColaborador} = req.body;
    pool.query('SELECT idColaborador, nomeColaborador, senhaColaborador, e.nomeEmpresa as empresa FROM tbcolaborador c inner join tbempresa e on e.idempresa = c.idempresa where emailColaborador = ?', [emailColaborador], (error,result) =>{
        //quando o if tem como parametro somente uma variavel, verificamos se essa variavel retorna true ou false
        //nessa relação com banco quando da algum erro no banco, error retorna true sempre por padrão
        if(error){
            return res.status(500).json({ message: 'Erro ao fazer login' });
        }


        //aqui verifica se houve alguma resposta da nossa requisição inicial, se houve algum retorno do select com cnpj
        //se não houve, o result.lenght vai ser 0 e vai retornar para a aplicação erro
        if(result.length === 0){
            return res.status(401).json({ message: 'Email ou senha incorretos' });

        }
        //caso seja maior q zero, vamos pegar a primeira posição do nosso array q armazena o resultado da query
        //e armazenar em uma variavel chamada resquery para manipular os dados de retorno mais facilmente

        const resquery = result[0];
        

        //aqui verificamos se a senha q o nosso usuario enviou da tela é diferente da que retornou do banco de dados, de acordo com o email fornecido
        //se nao for, retorna um código de erro junto com a mensagem de erro
        if(senhaColaborador !== resquery.senhaColaborador){
            return res.status(401).json({ message: 'Email ou senha incorretos' });
        }

        //caso seja igual, pegamos o id e o nome enviados na query e mandamos de volta para tela

        const id = resquery.idColaborador;
        const nmColaborador = resquery.nomeColaborador;
        const nmEmpresa = resquery.empresa;
        return res.status(200).json({retorno: 'Login bem sucedido', nmColaborador,id, nmEmpresa} );
    })
})

//select colaboradores
app.get('/api/colaboradores', (req, res) => {
    pool.query('SELECT * FROM tbcolaborador', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500);
        }
        return res.status(200).json(results);
    });
});

//select empresas
app.get('/api/empresa',(req,res) =>{
    pool.query('select * from tbempresa', (error, results) =>{
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar empresas' });
        }
        return res.status(200).json(results);
    });
})

// insert colaboradores
app.post('/api/colaboradores', (req, res) => {
    const { nomecolaborador, cargocolaborador, emailcolaborador, idempresa } = req.body;
    if(!nomecolaborador || !idempresa){
        return res.status(500).json({ message: 'Não é possível registrar o colaborador sem que seu nome ou a empresa a qual pertence, estejam preenchidos' });
    }
    const query = 'INSERT INTO tbcolaborador (nomecolaborador, cargocolaborador, emailcolaborador, idEmpresa) VALUES (?, ?, ?, ?)';
    pool.query(query, [nomecolaborador, cargocolaborador, emailcolaborador, idempresa], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Colaborador inserido com sucesso' });
    });
});

//insert empresa
app.post('/api/empresa', (req, res) => {
    const { nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa } = req.body;

    const query = 'INSERT INTO tbempresa (nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [nomeempresa, contatoempresa, emailempresa, senhaempresa, cnpjempresa], (error, results, fields) => {
        
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao inserir colaborador' });
        }
        return res.status(200).json({ message: 'Empresa cadastrada com sucesso' });
    });
});

app.listen(port, () => {
    console.log(`Servidor Node.js está executando na porta ${port}`);
});


 
